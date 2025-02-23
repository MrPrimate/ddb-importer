/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Haste extends DDBEnricherData {
  get activity() {
    if (!this.is2014) return null;
    return {
      activationType: "action",
    };
  }
}
