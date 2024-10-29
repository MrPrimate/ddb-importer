/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class HuntersMark extends DDBEnricherMixin {

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
      ? DDBEnricherMixin.allDamageTypes()
      : ["force"];

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
          damageParts: [DDBEnricherMixin.basicDamagePart({ number: 1, denomination: 6, types: damageTypes, scalingFormula: "" })],
        },
      },
    ];
  }

  get effect() {
    return {
      name: "Hunter's Mark",
    };
  }


}
