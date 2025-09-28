/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HealingLight extends DDBEnricherData {

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
          max: "clamp(@abilities.cha.mod, 1, @item.uses.value)",
        },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 6,
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
          spent: null,
          max: "1 + @classes.warlock.levels",
          recovery: [
            { period: "lr", type: "recoverAll", formula: undefined },
          ],
        },
      },
    };
  }

}
