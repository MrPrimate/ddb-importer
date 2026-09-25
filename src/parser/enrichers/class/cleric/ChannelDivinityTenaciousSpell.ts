import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinityTenaciousSpell extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "A creature succeeds on a save against your spell",
      data: {
        roll: {
          name: "Save Penalty",
          formula: "1d6",
          prompt: false,
          visible: true,
        },
        range: { units: "spec" },
      },
    };
  }

}
