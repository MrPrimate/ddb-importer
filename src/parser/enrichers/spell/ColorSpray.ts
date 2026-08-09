import DDBEnricherData from "../data/DDBEnricherData";

export default class ColorSpray extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (this.is2014) {
      return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
    } else {
      return null;
    }
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return {
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "4d10 + (2*@item.level)d10",
            name: "HP Effected",
          },
        },
      };
    } else {
      return null;
    }
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag | null {
    if (this.is2014) {
      return {
        name: "colorSpray.js",
        type: "spell",
        triggerPoints: ["preActiveEffects"],
      };
    }
    return null;
  }

  override get itemMacro(): IDDBItemMacro | null {
    if (this.is2014) {
      return {
        name: "colorSpray.js",
        type: "spell",
      };
    }
    return null;
  }

}
