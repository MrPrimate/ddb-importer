import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Mindrazor: a charge on a hit inflicts a psionic wound - an Intelligence save or vulnerability to
 * psychic damage for 1 minute, ending on a save at the end of its turns.
 */
export default class Mindrazor extends WeaponProperties {

  static WOUND = "Psionic Wound";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(Mindrazor.WOUND, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["int"], formula: "17" },
        condition: "When you hit a creature with an attack roll using the rapier",
        charges: "1",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Psionic Wound",
        activityMatch: Mindrazor.WOUND,
        changes: [DDBEnricherData.ChangeHelper.damageVulnerabilityChange("psychic")],
        options: { transfer: false, durationSeconds: 60, description: "Vulnerable to psychic damage for 1 minute; repeat the save at the end of each turn." },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("turn=end, saveAbility=int, saveDC=17, label=Psionic Wound", 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

}
