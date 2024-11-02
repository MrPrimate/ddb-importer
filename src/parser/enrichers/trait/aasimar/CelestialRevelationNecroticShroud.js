/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class CelestialRevelationNecroticShroud extends DDBEnricherMixin {

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
