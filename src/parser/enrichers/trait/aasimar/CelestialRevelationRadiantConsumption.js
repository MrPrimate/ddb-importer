/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class CelestialRevelationRadiantConsumption extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      activationType: "special",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({ customFormula: "@prof", type: "radiant" }),
      ],
    };
  }

}
