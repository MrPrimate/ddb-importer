import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspiringMovement extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      activationType: "reaction",
    };
  }

}
