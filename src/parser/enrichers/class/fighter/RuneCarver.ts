import DDBEnricherData from "../../data/DDBEnricherData";

export default class RuneCarver extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
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
