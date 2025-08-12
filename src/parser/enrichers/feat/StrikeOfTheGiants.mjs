/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class StrikeOfTheGiants extends DDBEnricherData {

  get type() {
    if (!this.isAction) return "none";
    if ([
      "Strike of the Giants: Fire Strike",
    ].includes(this.name)) return "damage";
    return "save";
  }


  get activity() {
    const nameArray = this.nameArray;
    return {
      name: nameArray[1].trim(),
      data: {
        damage: {
          onSave: "full",
        },
        effectConditionText: ["Cloud Strike"].includes(nameArray[1].trim()) ? "false" : "",
      },
    };
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return false;
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get nameArray() {
    if (this.name.includes(":")) return this.name.split(":");
    return this.name.replace(")", "").split("(");
  }

  get defaultActionName() {
    const nameArray = this.nameArray;
    return `${nameArray[0].trim()}: ${nameArray[1].trim()}`;
  }

  get builtFeaturesFromActionFilters() {
    if (this.isAction) return [];
    return [
      this.defaultActionName,
    ];
  }

  get override() {
    if (this.isAction) return null;
    const activity = this.ddbEnricher.defaultActionFeatures[this.defaultActionName][0];

    return {
      data: {
        effects: activity.effects,
        system: {
          description: activity.system.description,
        },
      },
    };
  }

  get clearAutoEffects() {
    return !this.isAction;
  }

  get effects() {
    if (!this.isAction) return [];
    const results = [];

    switch (this.name) {
      case "Strike of the Giants: Cloud Strike":
        results.push({
          name: "Cloud Cover: Invisible to target",
          statuses: ["Invisible"],
          options: {
            durationSeconds: 6,
          },
          daeSpecialDurations: ["turnStart", "1Attack", "1Spell"],
        });
        break;
      case "Strike of the Giants: Frost Strike":
        results.push({
          name: "Frost Struck: Speed Reduction",
          changes: [
            DDBEnricherData.ChangeHelper.customChange("0", 100, "system.attributes.movement.all"),
          ],
          options: {
            durationSeconds: 6,
          },
          daeSpecialDurations: ["turnStartSource"],
        });
        break;
      case "Strike of the Giants: Storm Strike":
        results.push({
          name: "Storm Struck: Disadvantage on attack rolls",
          midiChanges: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("true", 20, "flags.midi-qol.disadvantage.attack.all"),
          ],
          options: {
            durationSeconds: 6,
          },
          daeSpecialDurations: ["turnStartSource"],
        });
        break;
      // no default
    }

    return results;
  }

}
