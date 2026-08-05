import DDBEnricherData from "../data/DDBEnricherData";

export default class SuperiorDisciplinePotence extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Increase your Strength score by 1 per Blood Point expended (up to 6) for 1 hour",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      addScalingMode: "amount",
      addConsumptionScalingMax: "6",
    };
  }

}
