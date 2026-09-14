import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Detect Thoughts: sensing surface thoughts is the passive use; probing deeper is the Wisdom save.
 */
export default class DetectThoughts extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Probe Deeper",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sense Thoughts",
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
            type: "action",
            value: null,
            condition: "Detect thinking creatures within 30 feet or read surface thoughts",
          },
        },
      },
    ];
  }

}
