/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverLungingDash extends Maneuver {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.diceString,
            }),
          ],
        },
      },
    };
  }

}
