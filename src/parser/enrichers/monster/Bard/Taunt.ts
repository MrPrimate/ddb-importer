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
          // "until the start of the bard's next turn" - anchored on the acting monster, not
          // the target. The legacy hint also carried combatEnd, which a single native expiry
          // cannot co-express; the turn edge is the load-bearing half.
          expiry: "sourceStart",
          transfer: false,
          showIcon: true,
        },
      },
    ];
  }

}
