import DDBEnricherData from "../data/DDBEnricherData";

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
