import DDBEnricherData from "../data/DDBEnricherData";

export default class SupremeDisciplineCelerity extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      activationCondition: "Cast Haste on yourself; no lethargy when the spell ends",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      itemConsumeValue: "2",
    };
  }

}
