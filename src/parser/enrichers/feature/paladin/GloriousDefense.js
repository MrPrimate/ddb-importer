/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class GloriousDefense extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@abilities.cha.mod",
          name: "Bonus to attack",
        },
      },
    };
  }

}
