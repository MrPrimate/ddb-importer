import DICTIONARY from "../dictionary.js";
import logger from "../logger.js";

export class DDBAdventureFlags extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.title = "DDB Adventure Imported Flags";
    options.template = "modules/ddb-importer/handlebars/flag-details.hbs";
    options.classes = ["ddb-importer-flags", "sheet"];
    options.width = 800;
    return options;
  }

  /** @override */
  async getData() { // eslint-disable-line class-methods-use-this
    // console.warn(this);
    // console.warn(this.object);
    const item = this.object;

    let flags = {};

    const flagGroups = ["ddb", "ddbimporter", "monsterMunch", "ddb-importer"];
    const ignoredSubFlagGroups = ["ddbimporter.acEffects", "ddbimporter.autoAC"];

    function generateFlagLookup(flagData, flagName, flagGroupName) {
      logger.debug(`FlagName ${flagName}, flagGroupName ${flagGroupName}`, flagData);
      for (const flagKey in flagData) {
        logger.debug("flagkey", flagKey);
        const flagValue = (flagKey === "userData") ? flagData[flagKey]["userDisplayName"] : flagData[flagKey];
        const flagGroupSubName = `${flagGroupName}.${flagKey}`;
        if (typeof flagValue === "object" && !ignoredSubFlagGroups.includes(flagGroupName) && !Array.isArray(flagValue)) {
          logger.info(`recursive generateFlag call for ${flagName}`);
          generateFlagLookup(flagValue, flagKey, flagGroupSubName);
        } else if (!ignoredSubFlagGroups.includes(flagGroupName) && !ignoredSubFlagGroups.includes(flagGroupSubName)) {
          if (!flags[flagGroupName]) flags[flagGroupName] = [];
          flags[flagGroupName].push({
            key: flagKey,
            value: Array.isArray(flagValue) ? JSON.stringify(flagValue) : flagValue,
          });
        }
      }
    };

    flagGroups.forEach((flagGroup) => {
      logger.debug(`Flag group ${flagGroup}`, item.flags);
      generateFlagLookup(item.flags[flagGroup], flagGroup, flagGroup);
    });

    const result = {
      name: item.name,
      flags,
      monster: {
        isMonster: this.object.type == "npc",
        flags: [
          {
            name: "keepItems",
            description: "Keep this monsters item configuration for Adventure Muncher",
            isChecked: item.flags?.ddbimporter?.keepItems ?? false,
          },
          {
            name: "keepToken",
            description: "Keep token? (The image needs to be manually set in the export data)",
            isChecked: item.flags?.ddbimporter?.keepToken ?? false,
          },
          {
            name: "keepAvatar",
            description: "Keep avatar?  (The image needs to be manually set in the export data)",
            isChecked: item.flags?.ddbimporter?.keepAvatar ?? false,
          },
        ]
      },
      item: {
        isItem: DICTIONARY.types.monster.includes(this.object.type) || this.object.type === "spell",
        flags: [
          {
            name: "customItem",
            description: "Keep this custom item",
            isChecked: item.flags?.ddbimporter?.customItem ?? false,
          }
        ]
      },
    };

    if (item.link) result["link"] = item.link;
    if (flags.bookCode && flags.slug) result["ddbLink"] = `https://www.dndbeyond.com/${flags.bookCode}/${flags.slug}`;

    logger.debug("flags", flags);
    return result;
  }


  activateListeners(html) {
    super.activateListeners(html);
    // watch the change of the import-policy-selector checkboxes
    $(html)
      .find(
        [
          '.flag-policy input[type="checkbox"]',
        ].join(",")
      )
      .on("change", async (event) => {
        const selection = event.currentTarget.dataset.section;
        const checked = event.currentTarget.checked;
        logger.debug(`Updating flag-policy for ${this.object.name}, ${selection} to ${checked}`);

        await this.object.update({
          flags: {
            "ddbimporter": {
              [selection]: checked
            }
          }
        });
      });
  }
}
