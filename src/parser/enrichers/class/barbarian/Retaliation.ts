import DDBEnricherData from "../../data/DDBEnricherData";

export default class Retaliation extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "reaction",
    };
  }

}
