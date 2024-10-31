/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class GlyphOfWarding extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        "damage.parts": [
          DDBEnricherMixin.basicDamagePart({
            number: 5,
            denomination: 8,
            types: ["acid", "cold", "fire", "lightning", "thunder"],
            scalingFormula: "1",
            scalingMode: "whole",
          }),
        ],
      },
    };
  }


}
