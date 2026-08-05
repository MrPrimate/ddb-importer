import DDBEnricherData from "../data/DDBEnricherData";

export default class FeralWhispersCallOfTheWild extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "action",
      activationCondition: "Magic action; summoned Beasts arrive in 1d4 + 1 rounds",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
    };
  }

}
