import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverRally extends Maneuver {
  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `${this.diceString} + ${this.is2014 ? "@abilities.cha.mod" : "(@details.level / 2)"}`,
          types: ["temphp"],
        }),
      },
    };
  }
}
