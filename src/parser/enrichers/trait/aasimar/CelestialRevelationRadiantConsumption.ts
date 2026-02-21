import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationRadiantConsumption extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
      ],
    };
  }

}
