import DDBEnricherData from "../../data/DDBEnricherData";

export default class CunningAction extends DDBEnricherData {

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
