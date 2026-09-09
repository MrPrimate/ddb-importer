import DDBEnricherData from "../../data/DDBEnricherData";

export default class DireGambit extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain 1 Risk Die",
      targetType: "self",
      activationType: "special",
      activationCondition: "You roll Initiative or score a Critical Hit",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      itemConsumeValue: "-1",
    };
  }

}
