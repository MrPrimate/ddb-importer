/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class HealingLight extends DDBEnricherMixin {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      addItemConsume: true,
      addScalingMode: "amount",
      data: {
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        healing: DDBEnricherMixin.basicDamagePart({
          number: 1,
          denomination: 6,
          bonus: "3",
          types: ["healing"],
          scalingMode: "whole",
          scalingNumber: "1",
        }),
      },
    };
  }

  get override() {
    return {
      data: {
        "system.uses": {
          max: "1 + @classes.warlock.levels",
          recovery: [
            { period: "lr", type: "recoverAll", formula: undefined },
          ],
        },
      },
    };
  }

}