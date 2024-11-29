/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TacticalMaster extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("push", 10, "system.traits.weaponProf.mastery.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("sap", 10, "system.traits.weaponProf.mastery.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slow", 10, "system.traits.weaponProf.mastery.bonus"),
        ],
      },
    ];
  }

}
