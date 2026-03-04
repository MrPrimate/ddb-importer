import DDBEnricherData from "../../data/DDBEnricherData";

export default class HealingLight extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
          scalingNumber: 1,
        }),
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1 + @classes.warlock.levels",
        recovery: [
          { period: "lr", type: "recoverAll", formula: undefined },
        ],
      },
    };
  }

}
