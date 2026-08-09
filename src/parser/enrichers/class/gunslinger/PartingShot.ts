import DDBEnricherData from "../../data/DDBEnricherData";

export default class PartingShot extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "You take the Dash, Disengage, or Dodge action on your turn",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.secret-agent.parting-shot",
          name: "Risk Die (add to damage roll)",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: { name: "Parting Shot" },
    };
  }

}
