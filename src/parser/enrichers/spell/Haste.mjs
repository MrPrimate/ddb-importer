/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Haste extends DDBEnricherData {

  get effects() {
    return [
      {
        data: {
          duration: {
            seconds: 60,
            rounds: 10,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.customChange("*2", 30, "system.attributes.movement.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.dex.save.roll.mode`),
        ],
        // 2024 has wording that picks up special expiry incorrectly
        daeSpecialDurations: [],
      },
    ];
  }

}
