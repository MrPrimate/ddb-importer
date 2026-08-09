import DDBEnricherData from "../../data/DDBEnricherData";

export default class DisciplinedSurvivor extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
    };
  }

  override get clearAutoEffects() {
    return true;
  }

}
