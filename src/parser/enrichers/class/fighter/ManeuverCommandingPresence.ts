import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverCommandingPresence extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Commanding Presence Check",
      targetType: "self",
      activationType: "special",
      addItemConsume: true,
      data: {
        check: {
          associated: ["itm", "prf", "per"],
          ability: "cha",
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
