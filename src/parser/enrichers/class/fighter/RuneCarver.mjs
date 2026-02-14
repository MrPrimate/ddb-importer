/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RuneCarver extends DDBEnricherData {

  get type() {
    return "none";
  }

  get override() {
    return {
      data: {
        "system.enchant": {
          "max": "@scale.rune-knight.runes",
          "period": "lr",
        },
      },
    };
  }

}
