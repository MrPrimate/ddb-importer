import DDBEnricherData from "../data/DDBEnricherData";
import { itemCast } from "./_ItemActivities";

/**
 * The Magus Class. Charges cast Magic Missile (1) or Fireball (4, save DC 15); both deal Radiant
 * damage instead of their normal type, which the cast activity cannot change, so pick Radiant on
 * the spell's damage roll. Charges and dawn recovery come from DDB.
 */
export default class StarfallSpotter extends DDBEnricherData {

  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemCast("Magic Missile", { charges: 1 }),
      itemCast("Fireball", { charges: 4, dc: 15 }),
    ];
  }

}
