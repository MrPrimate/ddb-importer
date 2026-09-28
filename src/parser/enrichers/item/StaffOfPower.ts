import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, retributiveStrike } from "./_ItemActivities";

/**
 * Staff of Power: Power Strike spends a charge on a melee hit for an extra 1d6 force, and
 * Retributive Strike breaks the staff. Its spells import as their own cast activities.
 */
export default class StaffOfPower extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Power Strike", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["force"] })],
        condition: "When you hit with a melee attack using the staff",
        charges: "1",
        noeffect: true,
      }),
      retributiveStrike(this.text),
    ];
  }

}
