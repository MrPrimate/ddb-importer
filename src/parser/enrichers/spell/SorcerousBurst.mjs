/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SorcerousBurst extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      name: "Initial Damage",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: "1d8x@mod=8",
          types: ["acid", "cold", "fire", "lightning", "poison", "psychic", "thunder"],
          scalingMode: "whole",
          scalingNumber: "1",
        }),
      ],
    };
  }
}
