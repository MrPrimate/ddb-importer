import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationRadiantConsumption extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
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
