import DDBEnricherData from "../../data/DDBEnricherData";

export default class SlayersAid extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      targetCount: 1,
      activationType: "special",
      activationCondition: "When you use Studied Response, a friendly creature that can see or hear you may use its Reaction to attack the trigger",
      addItemConsume: true,
    };
  }

}
