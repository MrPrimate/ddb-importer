import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Hazirawn: while attuned a hit stops the target regaining hit points for 1 minute (Wounding,
 * applied by the attack), ending early on a Constitution save at the end of its turns, and its
 * extra necrotic grows from 1d6 to 2d6.
 */
export default class Hazirawn extends WeaponProperties {

  // the unattuned 1d6 necrotic goes on every hit; attunement's second die is the Attuned Necrotic
  // damage activity (dnd5e 5.x has no rule conditions). The attack applies Wounding, so it takes
  // effect links.
  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      // hidden until attuned: enricher activities on an attunement item require magic
      itemProperty("Attuned Necrotic", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] })],
        condition: "On a hit while attuned: the extra necrotic damage becomes 2d6",
        noeffect: true,
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
        // applied by a hit; dnd5e cannot gate an applied effect on the weapon's attunement, so the
        // requirement is in the description
        activityTypesMatch: ["attack"],
        options: {
          transfer: false,
          durationSeconds: 60,
          // lasts the minute unless a save at the end of its turn ends it, not to the turn's start
          expiry: null,
          description: "While Hazirawn is attuned, a creature it hits can't regain hit points for 1 minute. A DC 15 Constitution save at the end of each of its turns ends the effect.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("turn=end, saveAbility=con, saveDC=15, saveRemove=true, label=Hazirawn Wounding", 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

}
