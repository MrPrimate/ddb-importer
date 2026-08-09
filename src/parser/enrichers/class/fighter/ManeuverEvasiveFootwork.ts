import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverEvasiveFootwork extends Maneuver {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      activationType: "special",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
