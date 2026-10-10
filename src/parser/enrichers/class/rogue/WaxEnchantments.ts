import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Waxwork Rogue: Wax Enchantments holds the Wick Point pool every enchantment spends ("spend N wick
 * points" consumption resolves to `wick-points`). Three points at 3rd level and one more per Rogue
 * level, so the pool equals the Rogue level, regained on a short or long rest.
 */
export default class WaxEnchantments extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get identifier(): string | null {
    return "wick-points";
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Wax Enchantments: Wick Points",
      max: "@classes.rogue.levels",
      period: "sr",
    });
    return {
      uses,
    };
  }

}
