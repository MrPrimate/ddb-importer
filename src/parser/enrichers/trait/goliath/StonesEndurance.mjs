/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StonesEndurance extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "reaction",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d12 + @abilities.con.mod",
          name: "Reduce Damage Roll",
        },
      },
    };
  }

}
