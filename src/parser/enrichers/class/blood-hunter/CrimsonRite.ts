import DDBEnricherData from "../../data/DDBEnricherData";
import _CrimsonRite from "./_CrimsonRite";

/**
 * Crimson Rite: invoke a rite (taking hemocraft die damage that cannot be
 * reduced) and enchant a held weapon with it.
 *
 * The parent feature owns the rite choices, so it gets one Apply Rite activity
 * per rite the character actually knows, each enchanting the weapon with that
 * rite's damage type. Characters whose choices DDB did not capture fall back
 * to a single generic, untyped Apply Rite.
 */
export default class CrimsonRite extends _CrimsonRite {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return this.invokeRiteActivity;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const rites = this.knownRites;
    if (rites.length === 0) return [this.applyRiteActivity()];
    return rites.map((rite) => this.applyRiteActivity(rite));
  }

  get effects(): IDDBEffectHint[] {
    const rites = this.knownRites;
    if (rites.length === 0) return [this.riteEnchantEffect()];
    return rites.map((rite) => this.riteEnchantEffect(rite));
  }

}
