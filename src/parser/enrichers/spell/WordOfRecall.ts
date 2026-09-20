import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Word of Recall: designating the sanctuary is a separate action from the teleport.
 */
export default class WordOfRecall extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Teleport to Sanctuary",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Designate Sanctuary",
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
            condition: "Cast at a temple or place dedicated to your deity to designate it",
          },
        },
      },
    ];
  }

}
