/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

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
