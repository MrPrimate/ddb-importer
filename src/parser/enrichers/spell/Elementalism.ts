import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Elementalism: beckoning an element and sculpting it are separate uses of the cantrip.
 */
export default class Elementalism extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Beckon Element",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sculpt Element",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
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
            condition: "Shape a 1-foot cube of the element for 1 hour",
          },
        },
      },
    ];
  }

}
