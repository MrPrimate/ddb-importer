/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ChromaticOrb extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherMixin.basicDamagePart({ number: 3, denomination: 8, types: ["acid", "cold", "fire", "lightning", "poison", "thunder"], scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
      },
    };
  }

}
