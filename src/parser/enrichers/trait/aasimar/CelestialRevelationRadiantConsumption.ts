import DDBEnricherData from "../../data/DDBEnricherData";

export default class CelestialRevelationRadiantConsumption extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
      ],
    };
  }

}
