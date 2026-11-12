import DDBEnricherData from "../../data/DDBEnricherData";

export default class RuneCarver extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        "system.enchant": {
          "max": `@scale.${this.subclassIdentifier("Rune Knight")}.runes`,
          "period": "lr",
        },
      },
    };
  }

}
