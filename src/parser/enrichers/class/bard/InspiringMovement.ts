import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspiringMovement extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
    };
  }

}
