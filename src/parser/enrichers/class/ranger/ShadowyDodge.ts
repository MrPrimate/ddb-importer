import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShadowyDodge extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }


}
