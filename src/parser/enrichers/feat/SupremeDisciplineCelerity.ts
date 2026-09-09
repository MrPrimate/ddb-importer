import DDBEnricherData from "../data/DDBEnricherData";

export default class SupremeDisciplineCelerity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      activationCondition: "Cast Haste on yourself; no lethargy when the spell ends",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "2",
    };
  }

}
