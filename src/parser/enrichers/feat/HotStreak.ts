import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hot Streak (World of Warcraft): spells ignore Fire Resistance (a dnd5e 6.1 damage application
 * rule, not available on this dnd5e version).
 * Ignite (a creature hit by Fire starts burning, and burning damage grows by 1d4) stays description.
 */
export default class HotStreak extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
