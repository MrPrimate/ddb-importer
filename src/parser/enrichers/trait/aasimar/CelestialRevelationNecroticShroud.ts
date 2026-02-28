import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationNecroticShroud extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
    return {
      activationType: "special",
      targetType: "enemy",
    };
  }

}
