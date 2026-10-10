import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class magic items that improve one spell and are consumed when it is cast ("When you
 * cast the X spell, you can consume this magic item"). They import as a single use that destroys
 * the item, spent by an activity that fires with the spell. Subclasses name the spell and can
 * swap the activity type or add rolls, saves and applied effects; DDB's modifiers on these items
 * describe the spell's target, so they never become transfer effects on the owner.
 */
export default abstract class SpellComponentItem extends DDBEnricherData {

  abstract get spellName(): string;

  /** Extra hints merged into the consuming activity. */
  get componentActivity(): IDDBActivityData {
    return {};
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: `Consume with ${this.spellName}`,
      activationType: "special",
      activationCondition: `When you cast ${this.spellName}`,
      addItemConsume: true,
      ...this.componentActivity,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [],
        autoDestroy: true,
      },
    };
  }

}
