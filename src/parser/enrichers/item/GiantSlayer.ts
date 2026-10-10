import DDBEnricherData from "../data/DDBEnricherData";
import { conditionalWeaponDamage, noExtraAttackDamage, unrestrictedDamageParts } from "./_ItemActivities";

/**
 * Giant Slayer: a hit against a Giant deals an extra 2d6 of the weapon's type. The record DDB
 * leaves unrestricted gets that as its own damage activity; the weapon variants restrict it
 * "Against Giants" and keep the parser's Restricted Attack.
 */
export default class GiantSlayer extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return unrestrictedDamageParts(this).length > 0 ? noExtraAttackDamage() : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const parts = unrestrictedDamageParts(this);
    if (parts.length === 0) return [];
    return [conditionalWeaponDamage("Against Giants", parts, "When you hit a Giant with this weapon")];
  }

}
