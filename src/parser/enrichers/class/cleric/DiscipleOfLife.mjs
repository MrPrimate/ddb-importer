/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DiscipleOfLife extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        description: {
          chatFlavor: "Choose level of spell for scaling",
        },
        "consumption.scaling": {
          allowed: true,
          max: "9",
        },
        healing: DDBEnricherData.basicDamagePart({ bonus: "3", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    };
  }

}
