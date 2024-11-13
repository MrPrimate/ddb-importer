/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ChaosBolt extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherMixin.basicDamagePart({ customFormula: "2d8 + 1d6", scalingMode: "whole", scalingFormula: "1d6" }),
            // DDBBaseEnricher.basicDamagePart({ customFormula: "2d8 + 1d6", types: ["acid", "cold", "fire", "force", "lightning", "poison", "psychic", "thunder"] }),
          ],
        },
      },
    };
  }

}
