/* eslint-disable class-methods-use-this */
import Maneuver from "./Maneuver.mjs";

export default class ManeuverPrecisionAttack extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: this.diceString,
          name: "Add to Attack Roll",
        },
      },
    };
  }

}
