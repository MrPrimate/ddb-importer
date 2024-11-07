/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class BendLuck extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Bend Luck Roll",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d4",
          name: "Bend Luck Roll",
        },
      },
    };
  }

}
