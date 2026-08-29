import DDBEnricherData from "../data/DDBEnricherData";

export default class SuperiorDisciplineCelerity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Extra action usable only for Attack (one attack), Dash, Disengage, Dodge, Hide, or Utilize",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
    };
  }

}
