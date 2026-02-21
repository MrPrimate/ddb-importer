import DDBEnricherData from "../../data/DDBEnricherData";

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
