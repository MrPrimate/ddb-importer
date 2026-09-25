import DDBEnricherData from "../data/DDBEnricherData";

export default class FeralWhispersCallOfTheWild extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "action",
      activationCondition: "Magic action; summoned Beasts arrive in 1d4 + 1 rounds",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
    };
  }

}
