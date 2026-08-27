import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverGrapplingStrike extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Grappling Strike Check",
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Immediately after you hit a creature with a melee attack on your turn; resolve the opposing contest manually",
      addItemConsume: true,
      data: {
        check: {
          associated: ["ath"],
          ability: "str",
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
