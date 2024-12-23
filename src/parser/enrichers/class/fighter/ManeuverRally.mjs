/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverRally extends Maneuver {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `${this.diceString} + ${this.is2014 ? "@abilities.cha.mod" : "@details.level"}`,
          types: ["temphp"],
        }),
      },
    };
  }
}
