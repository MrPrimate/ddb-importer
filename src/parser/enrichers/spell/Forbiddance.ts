import DDBEnricherData from "../data/DDBEnricherData";

export default class Forbiddance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
