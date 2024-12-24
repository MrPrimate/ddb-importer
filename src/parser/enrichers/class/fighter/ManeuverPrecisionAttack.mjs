/* eslint-disable class-methods-use-this */
import { DDBEnricherData } from "../../data/_module.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverPrecisionAttack extends Maneuver {

  get type() {
    return "utility";
  }

  get activity() {
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

  get effects() {
    return [
      {
        name: "Precision Attack Bonus",
        daeSpecialDurations: ["1Attack"],
        data: {
          duration: {
            turns: 1,
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
