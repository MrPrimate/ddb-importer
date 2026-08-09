import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/**
 * Regain hit points equal to your proficiency bonus at the start of each turn you are below
 * half your maximum, for 1 hour, at the cost of 10 feet of speed.
 *
 * The regeneration needs midi's OverTime handling; ChangeHelper.overTimeDamageChange has no
 * condition parameter, so the string is built here.
 */
export default class FormulaReconstruction extends _Mutagen {

  override get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        durationSeconds: 3600,
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-10", 20, "system.attributes.movement.walk"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `label=Mutagen: ${this.mutagenName} (Start of Turn),turn=start,savingThrow=false,`
            + "damageRoll=@prof,damageType=healing,"
            + "condition=@attributes.hp.value > 0 && @attributes.hp.value < (@attributes.hp.max / 2),"
            + "killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      }),
    ];
  }

}
