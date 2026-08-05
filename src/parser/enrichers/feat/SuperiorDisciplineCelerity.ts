import DDBEnricherData from "../data/DDBEnricherData";

export default class SuperiorDisciplineCelerity extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Extra action usable only for Attack (one attack), Dash, Disengage, Dodge, Hide, or Utilize",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
    };
  }

}
