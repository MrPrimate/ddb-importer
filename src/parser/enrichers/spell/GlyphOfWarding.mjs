/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GlyphOfWarding extends DDBEnricherData {

  get activity() {
    return {
      data: {
        "damage.parts": [
          DDBEnricherData.basicDamagePart({
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
