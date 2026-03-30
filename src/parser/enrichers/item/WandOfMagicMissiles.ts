import DDBEnricherData from "../data/DDBEnricherData";

export default class WandOfMagicMissiles extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      addItemConsume: true,
      addScalingMode: "amount",
      targetType: "creature",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({
            number: 3,
            denomination: 4,
            bonus: "3",
            types: ["force"],
            scalingMode: "whole",
            scalingNumber: 1,
            scalingFormula: "1",
          })],
        },
        "consumption.scaling": {
          allowed: true,
          max: this.is2014 ? "@item.uses.max - @item.uses.spent" : "min(@item.uses.max - @item.uses.spent, 3)",
        },
        range: {
          value: "120",
          units: "ft",
        },
      },
    };
  }

}
