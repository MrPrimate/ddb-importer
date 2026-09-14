import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Control Water: the whirlpool option is the only one with a save and damage; the flood, part and redirect options share one utility.
 */
export default class ControlWater extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Create Whirlpool",
      data: {
        target: {
          template: { type: "cylinder", size: "25", height: "25", width: "", units: "ft", count: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Flood, Part, or Redirect",
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
            condition: "Choose one effect on each of your turns while concentrating",
          },
        },
      },
    ];
  }

}
