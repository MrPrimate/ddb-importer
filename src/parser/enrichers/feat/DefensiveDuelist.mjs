/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class DefensiveDuelist extends DDBEnricherData {

  // get type() {
  //   return "utility";
  // }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 6,
          durationTurns: 1,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@system.attributes.prof", 20, "system.attributes.ac.bonus"),
        ],
        daeSpecialDuration: this.is2014 ? ["isAttacked"] : [],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }


  get useDefaultAdditionalActivities() {
    return true;
  }

  // future enhancement: add restriction to trigger reaction based on attack type

}
