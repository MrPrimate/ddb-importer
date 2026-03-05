import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowyDodge extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }


}
