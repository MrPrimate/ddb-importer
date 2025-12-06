/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import { DICTIONARY } from "../../../../config/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Taunt extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Taunted",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        changes: DICTIONARY.actor.abilities.map((a) => {
          return [
            DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${a.value}.check.roll.mode`),
            DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${a.value}.save.roll.mode`),
          ];
        }).flat(),
        options: {
          durationSeconds: 12,
          durationRounds: 2,
          transfer: false,
          showIcon: true,
        },
        daeSpecialDurations: ["turnStart", "combatEnd"],
      },
    ];
  }

}
