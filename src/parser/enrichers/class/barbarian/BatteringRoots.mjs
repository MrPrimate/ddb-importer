/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BatteringRoots extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("push", 20, "system.traits.weaponProf.mastery.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("topple", 20, "system.traits.weaponProf.mastery.bonus"),
        ],
      },
    ];
  }

}
