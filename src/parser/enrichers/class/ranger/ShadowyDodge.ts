import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowyDodge extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }


}
