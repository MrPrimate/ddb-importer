import WeaponProperties from "./_WeaponProperties";
import { retributiveStrike } from "./_ItemActivities";

/**
 * Staff of the Magi: Retributive Strike breaks the staff. Its spells import as their own cast
 * activities, and Spell Absorption is a reaction the table resolves.
 */
export default class StaffOfTheMagi extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [retributiveStrike(this.text)];
  }

}
