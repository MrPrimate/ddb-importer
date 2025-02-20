/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Forbiddance extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
        },
        overrides: {
          noSpellslot: true,
          overrideTarget: true,
          targetType: "creature",
        },
      },
    ];
  }

}
