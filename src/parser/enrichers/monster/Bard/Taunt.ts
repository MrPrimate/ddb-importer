// import { utils } from "../../../../lib/_module";
import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

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
        daeSpecialDurations: ["turnStart" as const, "combatEnd" as const],
      },
    ];
  }

}
