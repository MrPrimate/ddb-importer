/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class CelestialRevelation extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      type: this.is2014 ? "utility" : "damage",
      noTemplate: true,
      data: {
        damage: {
          parts: [
            DDBEnricherMixin.basicDamagePart({ customFormula: "@prof", types: ["radiant", "necrotic"] }),
          ],
        },
      },
    };
  }

  get effect() {
    return {};
  }

}
