/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ShellDefenseWithdraw extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "In Shell",
        options: {
          transfer: true,
          disabled: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("4", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.con.save.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, "system.abilities.dex.save.roll.mode"),
        ],
        statuses: ["Prone"],
      },
    ];
  }

}
