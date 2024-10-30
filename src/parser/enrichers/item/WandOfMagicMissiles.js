/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class WandOfMagicMissiles extends DDBEnricherMixin {

  get activity() {
    return {
      type: "damage",
      addItemConsume: true,
      targetType: "creature",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBEnricherMixin.basicDamagePart({
            number: 3,
            denomination: 4,
            types: ["force"],
            scalingMode: "whole",
            scalingFormula: "1d4 + 1",
          })],
        },
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        range: {
          value: "120",
          units: "ft",
        },
      },
    };
  }

}
