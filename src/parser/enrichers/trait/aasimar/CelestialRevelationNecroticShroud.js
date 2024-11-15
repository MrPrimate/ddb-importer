/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CelestialRevelationNecroticShroud extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "enemy",
    };
  }

}
