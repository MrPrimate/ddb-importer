// import { utils } from "../../../../lib/_module";
import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class Taunt extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Taunted",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        changes: DICTIONARY.actor.abilities.map((a) => {
          return [
            DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange(a.value),
            DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange(a.value),
          ];
        }).flat(),
        options: {
          durationSeconds: 12,
          durationRounds: 2,
          transfer: false,
          showIcon: 2,
        },
        daeSpecialDurations: ["turnStart" as const, "combatEnd" as const],
      },
    ];
  }

}
