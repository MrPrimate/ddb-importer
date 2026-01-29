/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CloudRune extends DDBEnricherData {

  // get clearAutoEffects() {
  //   return true;
  // }

  get activity() {
    return {
      name: "Invoke Rune (Redirect Attack)",
    };
  }

  get effects() {
    return [
      {
        noCreate: true,
        name: "Cloud Rune: Passive Bonuses",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.slt.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.dec.roll.mode"),
        ],
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Cloud Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
