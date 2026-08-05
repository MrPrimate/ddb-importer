import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverDodgeRoll extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

}
