import DDBEnricherData from "../data/DDBEnricherData";
import { conditionalWeaponDamage, noExtraAttackDamage, unrestrictedDamageParts } from "./_ItemActivities";

/**
 * Whelm: a ranged attack roll with the hammer deals an extra 1d8 force, or 4d8 against a
 * Construct, an Elemental or a Giant (DDB's Restricted Attack). The 1d8 is its own damage activity
 * for a thrown hit, so a melee hit does not roll it.
 */
export default class Whelm extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return unrestrictedDamageParts(this).length > 0 ? noExtraAttackDamage() : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const parts = unrestrictedDamageParts(this);
    if (parts.length === 0) return [];
    return [conditionalWeaponDamage("Ranged Strike", parts, "When you hit with a ranged attack roll using Whelm")];
  }

}
