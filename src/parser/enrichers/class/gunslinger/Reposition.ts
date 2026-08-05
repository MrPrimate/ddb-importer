import DDBEnricherData from "../../data/DDBEnricherData";

export default class Reposition extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "An attack roll misses you",
    };
  }

}
