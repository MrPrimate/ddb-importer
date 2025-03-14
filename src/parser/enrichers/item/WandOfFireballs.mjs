/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WandOfFireballs extends DDBEnricherData {
  get activity() {
    return {
      type: "save",
      addItemConsume: true,
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "",
            formula: "15",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 8,
              denomination: 6,
              type: "fire",
              scalingMode: "whole",
              scalingNumber: "1",
            }),
          ],
        },
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        range: {
          value: "150",
          units: "ft",
        },
        target: {
          affects: {
            count: "",
            type: "",
          },
          template: {
            contiguous: false,
            type: "sphere",
            size: "20",
            units: "ft",
          },
        },
      },
    };
  }
}
