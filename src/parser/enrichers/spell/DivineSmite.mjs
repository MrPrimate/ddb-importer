/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class DivineSmite extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherMixin.basicDamagePart({ number: 3, denomination: 6, types: ["acid", "cold", "fire", "lightning", "poison"], scalingMode: "whole", scalingNumber: 1 }),
          ],
        },
      },
    };
  }

}
