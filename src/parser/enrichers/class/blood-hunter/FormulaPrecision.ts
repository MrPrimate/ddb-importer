import DDBEnricherData from "../../data/DDBEnricherData";
import _Mutagen from "./_Mutagen";

/** Weapon attacks crit on a 19 or 20, at the cost of Strength saving throws. */
export default class FormulaPrecision extends _Mutagen {

  get effects(): IDDBEffectHint[] {
    return [
      this.mutagenEffect({
        changes: [
          // downgrade so this never worsens an improved threshold from another source
          DDBEnricherData.ChangeHelper.downgradeChange("19", 25, "flags.dnd5e.weaponCriticalThreshold"),
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("str"),
        ],
      }),
    ];
  }

}
