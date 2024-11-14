/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class SorcerousBurst extends DDBEnricherMixin {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      name: "Initial Damage",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          customFormula: "1d8x@mod=8",
          types: ["acid", "cold", "fire", "lightning", "poison", "psychic", "thunder"],
          scalingMode: "whole",
          scalingNumber: "1",
        }),
      ],
    };
  }
}
