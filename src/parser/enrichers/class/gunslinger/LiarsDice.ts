import DDBEnricherData from "../../data/DDBEnricherData";

export default class LiarsDice extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      activationCondition: "You make a damage roll with a Ranged weapon",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        name: "Liar's Dice",
      },
    };
  }

}
