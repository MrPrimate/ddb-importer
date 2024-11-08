/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ColorSpray extends DDBEnricherMixin {

  get type() {
    if (this.is2014) {
      return "utility";
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

}
