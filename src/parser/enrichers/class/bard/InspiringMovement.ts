import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspiringMovement extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
    };
  }

}
