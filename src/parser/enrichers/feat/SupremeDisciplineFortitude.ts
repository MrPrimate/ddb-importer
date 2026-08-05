import DDBEnricherData from "../data/DDBEnricherData";

export default class SupremeDisciplineFortitude extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When you take damage except Fire and Radiant; 2 Blood Points halves it, 4 reduces it to 0",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      itemConsumeValue: "2",
      addScalingMode: "amount",
      addConsumptionScalingMax: "4",
    };
  }

}
