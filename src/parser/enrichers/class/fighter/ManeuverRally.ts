import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverRally extends Maneuver {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
