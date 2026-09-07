import DDBEnricherData from "../../data/DDBEnricherData";

export default class Reposition extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "An attack roll misses you",
    };
  }

}
