import DDBEnricherData from "../data/DDBEnricherData";

export default class SupremeDisciplineAuspex extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      activationCondition: "Cast True Seeing on yourself",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      itemConsumeValue: "2",
    };
  }

}
