import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hot Streak (World of Warcraft): spells ignore Fire Resistance (a dnd5e damage application rule).
 * Ignite (a creature hit by Fire starts burning, and burning damage grows by 1d4) stays description.
 */
export default class HotStreak extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get effects(): IDDBEffectHint[] {
    const changes = DDBEnricherData.ChangeHelper.ignoreResistanceChanges("fire");
    if (changes.length === 0) return [];
    return [
      {
        name: "Fire Mastery",
        options: {
          transfer: true,
        },
        changes,
      },
    ];
  }

}
