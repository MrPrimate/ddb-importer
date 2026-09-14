import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Move Earth: after the initial cast, each 10 minutes a new 40-foot area can be reshaped.
 */
export default class MoveEarth extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Initial Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Affect New Area",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Every 10 minutes while concentrating, choose a new area of terrain",
          },
        },
      },
    ];
  }

}
