import DDBEnricherData from "../../data/DDBEnricherData";

export default class StormSoul extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "special",
    };
  }

}
