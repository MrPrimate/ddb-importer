import DDBEnricherData from "../../data/DDBEnricherData";

export default class BestialFury extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "Once per turn, when you hit with a Melee weapon or Unarmed Strike (roll damage twice, use either)",
      addItemConsume: true,
      itemConsumeTargetName: "The Beast",
    };
  }

}
