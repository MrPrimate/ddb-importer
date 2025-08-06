/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class VedalkenDispassion extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: false,
        },
        changes: ["int", "wis", "cha"].map((ability) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, `system.abilities.${ability}.save.roll.mode`),
        ),
      },
    ];
  }

}
