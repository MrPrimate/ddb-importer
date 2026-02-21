import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedShadowStep extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

}
