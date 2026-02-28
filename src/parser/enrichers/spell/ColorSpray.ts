import DDBEnricherData from "../data/DDBEnricherData";

export default class ColorSpray extends DDBEnricherData {

  get type() {
    if (this.is2014) {
      return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
    } else {
      return null;
    }
  }

  get activity() {
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

  get setMidiOnUseMacroFlag() {
    if (this.is2014) {
      return {
        name: "colorSpray.js",
        type: "spell",
        triggerPoints: ["preActiveEffects"],
      };
    }
    return null;
  }

  get itemMacro() {
    if (this.is2014) {
      return {
        name: "colorSpray.js",
        type: "spell",
      };
    }
    return null;
  }

}
