import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Ratbite: any creature it damages makes a Constitution save or contracts Sewer Plague, and a
 * critical hit adds 2d4 necrotic and disadvantage on saves against magical contagions.
 */
export default class Ratbite extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Sewer Plague", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "11" },
        condition: "A creature that takes damage from these weapons; it contracts Sewer Plague on a failure",
        noeffect: true,
      }),
      itemProperty("Plague Bite", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["necrotic"] })],
        condition: "A critical hit; the target also has disadvantage on saves against magical contagions for seven days",
        noeffect: true,
      }),
    ];
  }

}
