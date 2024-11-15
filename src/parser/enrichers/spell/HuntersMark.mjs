/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HuntersMark extends DDBEnricherData {

  get type() {
    return "utility"; // activity type - if type is none, activity hit will be generally undefined
  }

  get activity() {
    return {
      data: {
        name: "Cast",
      },
    };
  }

  get additionalActivities() {
    const damageTypes = this.is2014
      ? DDBEnricherData.allDamageTypes()
      : ["force"];

    const hasFoeSlayer = this.is2024 && this.hasClassFeature({ featureName: "Foe Slayer", className: "Ranger" });
    const denomination = hasFoeSlayer
      ? 10
      : 6;

    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateSave: false,
          generateConsumption: false,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "", condition: "When you hit creature with attack" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination, types: damageTypes, scalingFormula: "" })],
        },
      },
    ];
  }

  get effects() {
    return [{
      name: "Hunter's Mark",
    }];
  }


}
