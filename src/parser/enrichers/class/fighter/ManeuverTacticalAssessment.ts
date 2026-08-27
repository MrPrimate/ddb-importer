import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverTacticalAssessment extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Tactical Assessment Check",
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
      data: {
        check: {
          associated: ["his", "inv", "ins"],
          ability: "",
          bonus: this.diceString,
          dc: {
            calculation: "",
            formula: "",
          },
          visible: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [];
  }

}
