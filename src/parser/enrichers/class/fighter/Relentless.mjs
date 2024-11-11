/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class Relentless extends DDBEnricherMixin {

  get type() {
    if (this.is2014) return null;
    return "utility";
  }

  get activity() {
    if (this.is2014) return null;
    return {
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d8",
          name: "Maneuver Roll",
        },
      },
    };
  }

}
