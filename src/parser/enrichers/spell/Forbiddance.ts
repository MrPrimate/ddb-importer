import DDBEnricherData from "../data/DDBEnricherData";

export default class Forbiddance extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Cast",
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
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
