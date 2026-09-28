import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Failed Purity Spear: a charge on a hit forces a Constitution save or a point of corruption for 1
 * minute. Each point deals 1d4 poison at the start of the creature's turns (up to 3d4, ignoring
 * resistance and immunity) and a save at the end of its turns removes one; three points poison it.
 * Charging 20 feet into a hit adds 1d6 piercing.
 */
export default class FailedPuritySpear extends WeaponProperties {

  static CORRUPT = "Corruption";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(FailedPuritySpear.CORRUPT, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "15" },
        condition: "When you hit a creature with the spear; a failure adds a point of corruption",
        charges: "1",
      }),
      itemProperty("Corruption Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["poison"] })],
        condition: "At the start of a corrupted creature's turn, 1d4 per point (up to 3d4); ignores resistance and immunity",
        noeffect: true,
      }),
      itemProperty("Remove Corruption", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "15" },
        condition: "A corrupted creature at the end of each of its turns; a success removes one point",
        noeffect: true,
      }),
      itemProperty("Charge", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["piercing"] })],
        condition: "You move at least 20 feet straight toward the target and hit it with the spear on the same turn",
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Corruption",
        activityMatch: FailedPuritySpear.CORRUPT,
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "1 point of corruption for 1 minute: 1d4 poison per point at the start of each turn (max 3d4). Poisoned at 3 or more points.",
        },
      },
    ];
  }

}
