import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Trapper's Teeth: a charge on a hit clamps spectral teeth on the target, setting its Speed to 0
 * with no save; a Strength save at the end of each of its turns frees it.
 */
export default class TrappersTeeth extends WeaponProperties {

  static CLAMP = "Spectral Teeth";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(TrappersTeeth.CLAMP, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "When you hit with an attack using the teeth",
        charges: "1",
      }),
      itemProperty("Break Free", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "13" },
        condition: "The clamped creature at the end of each of its turns; a success ends the effect",
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spectral Teeth",
        activityMatch: TrappersTeeth.CLAMP,
        changes: [DDBEnricherData.ChangeHelper.customChange("*0", 50, "system.attributes.movement.all")],
        options: {
          transfer: false,
          durationSeconds: null,
          description: "Speed 0. A DC 13 Strength save at the end of each of its turns ends the effect.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("turn=end, saveAbility=str, saveDC=13, label=Spectral Teeth", 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return this.textCharges;
  }

}
