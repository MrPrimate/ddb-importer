/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TacticalMind extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10",
          name: "Roll Ability Check Bonus",
        },
      },
    };
  }

}
