/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GloriousDefense extends DDBEnricherData {

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
