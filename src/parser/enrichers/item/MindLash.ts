import DDBEnricherData from "../data/DDBEnricherData";
import { conditionalWeaponDamage, noExtraAttackDamage, unrestrictedDamageParts } from "./_ItemActivities";

/**
 * Mind Lash: in the hands of an illithid it deals an extra 2d4 psychic on a hit, and is a plain
 * whip for anyone else, so the die is its own damage activity.
 */
export default class MindLash extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    return unrestrictedDamageParts(this).length > 0 ? noExtraAttackDamage() : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const parts = unrestrictedDamageParts(this);
    if (parts.length === 0) return [];
    return [conditionalWeaponDamage("Illithid Wielder", parts, "When an illithid wielding the whip hits")];
  }

}
