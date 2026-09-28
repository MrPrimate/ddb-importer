import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Starcrossed bows and crossbows: a charge on a ranged hit bursts the bolt in a flash; the target
 * and every creature within 10 feet of it make a Constitution save or are Blinded until the end of
 * your next turn.
 */
export default class StarcrossedWeapon extends WeaponProperties {

  static FLASH = "Starburst";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(StarcrossedWeapon.FLASH, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "15" },
        condition: "When you hit with a ranged attack: the target and every creature within 10 feet of it",
        template: { type: "radius", size: "10" },
        range: { value: "150", units: "ft" },
        charges: "1",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{ name: "Starburst", activityMatch: StarcrossedWeapon.FLASH, statuses: ["Blinded"], options: { transfer: false, expiry: "sourceEnd", durationSeconds: 12, durationRounds: 2 } }];
  }

  override get override(): IDDBOverrideData {
    return this.textCharges;
  }

}
