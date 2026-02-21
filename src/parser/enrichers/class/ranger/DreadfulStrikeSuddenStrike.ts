import DDBEnricherData from "../../data/DDBEnricherData";

export default class DreadfulStrikeSuddenStrike extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use the Dreadful Strike effect",
    };
  }

}
