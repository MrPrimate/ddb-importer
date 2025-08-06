/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Bladesong extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(@abilities.int.mod,1)", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(@abilities.int.mod,1)", 20, "system.attributes.concentration.bonuses.save"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.acr.roll.mode"),
        ],
      },
    ];
  }

}
