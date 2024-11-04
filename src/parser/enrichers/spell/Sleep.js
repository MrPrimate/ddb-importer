/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Sleep extends DDBEnricherMixin {

  get type() {
    return this.is2014 ? "utility" : null;
  }

  get activity() {
    if (this.is2014) {
      return {
        data: {
          roll: {
            prompt: false,
            visible: false,
            formula: "3d8 + (2*@item.level)d8",
            name: "HP Effected",
          },
        },
      };
    }
    return null;
  }

}
