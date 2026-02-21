import DDBEnricherData from "../../data/DDBEnricherData";

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
