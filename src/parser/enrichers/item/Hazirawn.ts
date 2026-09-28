import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Hazirawn: while attuned a hit stops the target regaining hit points for 1 minute, ending early
 * on a Constitution save at the end of its turns, and its extra necrotic grows from 1d6 to 2d6.
 */
export default class Hazirawn extends WeaponProperties {

  static WOUNDING = "Wounding";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Attuned Necrotic", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] })],
        condition: "On a hit while attuned: the extra necrotic damage becomes 2d6",
        noeffect: true,
      }),
      itemProperty(Hazirawn.WOUNDING, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "While attuned, any creature you hit",
      }),
      itemProperty("End Wounding", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "15" },
        condition: "The wounded creature at the end of each of its turns; a success ends the effect",
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hazirawn: Wounding",
        activityMatch: Hazirawn.WOUNDING,
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Can't regain hit points for 1 minute. A DC 15 Constitution save at the end of each of its turns ends the effect.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("turn=end, saveAbility=con, saveDC=15, label=Hazirawn Wounding", 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

}
