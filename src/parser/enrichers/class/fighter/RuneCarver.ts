import DDBEnricherData from "../../data/DDBEnricherData";

export default class RuneCarver extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get override(): IDDBOverrideData {
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
