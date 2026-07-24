import { DICTIONARY } from "../config/_module";
import { logger } from "../lib/_module";

type TFlags = Partial<FlagConfig> & Partial<{ ddbimporter: IDDBImporterFlags }> & Record<string, any>;

/** the document whose ddb flags are shown/edited by this application */
interface IFlagDocument {
  name: string;
  type: string;
  link?: string;
  flags: TFlags;
  update: (data: object) => Promise<unknown>;
}

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
  async getData() {
    // console.warn(this);
    // console.warn(this.object);
    const item = this.object as TAll5eItemDocuments | I5eMonsterData | I5eVehicleData;

    const flags: TFlags = {};

    const flagGroups = ["ddb", "ddbimporter", "monsterMunch", "ddb-importer"];
    const ignoredSubFlagGroups = ["ddbimporter.acEffects", "ddbimporter.autoAC"];

    function generateFlagLookup(flagData: any, flagName: string, flagGroupName: string) {
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
      generateFlagLookup(foundry.utils.getProperty(item.flags ?? {}, flagGroup), flagGroup, flagGroup);
    });

    const result = {
      name: item.name,
      flags,
      monster: {
        isMonster: item.type === "npc",
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
        ],
      },
      item: {
        isItem: DICTIONARY.types.monster.includes(item.type) || item.type === "spell",
        flags: [
          {
            name: "customItem",
            description: "Keep this custom item",
            isChecked: item.flags?.ddbimporter?.customItem ?? false,
          },
        ],
      },
    };

    // if (item.link) result["link"] = item.link;
    // if (flags.bookCode && flags.slug) result["ddbLink"] = `https://www.dndbeyond.com/${flags.bookCode}/${flags.slug}`;

    logger.debug("flags", flags);
    return result;
  }


  activateListeners(html: JQuery<HTMLElement>) {
    super.activateListeners(html);
    // watch the change of the import-policy-selector checkboxes
    $(html)
      .find(
        [
          ".flag-policy input[type=\"checkbox\"]",
        ].join(","),
      )
      .on("change", async (event) => {
        const target = event.currentTarget as HTMLInputElement;
        const selection = target.dataset.section;
        if (!selection) {
          logger.warn("DDBAdventureFlags: checkbox is missing its data-section attribute", target);
          return;
        }
        const checked = target.checked;
        const doc = this.object as IFlagDocument;
        logger.debug(`Updating flag-policy for ${doc.name}, ${selection} to ${checked}`);

        await doc.update({
          flags: {
            "ddbimporter": {
              [selection]: checked,
            },
          },
        });
      });
  }

  /** @override - this application updates via checkbox listeners, not form submission */
  async _updateObject(_event: Event, _formData: object): Promise<void> {
    // no-op
  }
}
