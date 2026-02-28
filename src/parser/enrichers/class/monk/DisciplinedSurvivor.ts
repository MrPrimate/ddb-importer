import DDBEnricherData from "../../data/DDBEnricherData";

export default class DisciplinedSurvivor extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      targetType: "self",
    };
  }

  get clearAutoEffects() {
    return true;
  }

}
