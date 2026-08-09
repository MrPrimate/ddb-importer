import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadfulStrikeSuddenStrike extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use the Dreadful Strike effect",
    };
  }

}
