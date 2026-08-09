import { DDBEnricherData } from "../../data/_module";
import Maneuver from "./Maneuver";

export default class ManeuverPrecisionAttack extends Maneuver {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Precision Attack",
      activationType: "reaction",
      targetType: "self",
      addItemConsume: true,
      // data: {
      //   roll: {
      //     prompt: false,
      //     visible: false,
      //     formula: this.diceString,
      //     name: "Add to Attack Roll",
      //   },
      // },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Precision Attack Bonus",
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.rwak.attack"),
        ],
      },
    ];
  }

}
