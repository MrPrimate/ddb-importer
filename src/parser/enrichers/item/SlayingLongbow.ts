import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Slaying Longbow: a natural 20 against a creature under 100 hit points forces a Constitution save
 * or it dies. The damage is inverted from a normal save: a SUCCESS takes an extra 6d8 radiant, so
 * the save carries none and the radiant is its own activity.
 */
export default class SlayingLongbow extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Slaying Shot", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "15" },
        condition: "A 20 on a ranged attack roll against a creature with fewer than 100 hit points; it dies on a failure. Good-aligned creatures and those with legendary actions succeed automatically",
        range: { value: "150", units: "ft" },
        noeffect: true,
      }),
      itemProperty("Slaying Shot: Radiant", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 6, denomination: 8, types: ["radiant"] })],
        condition: "The creature succeeds on the Slaying Shot save",
        range: { value: "150", units: "ft" },
        noeffect: true,
      }),
    ];
  }

}
