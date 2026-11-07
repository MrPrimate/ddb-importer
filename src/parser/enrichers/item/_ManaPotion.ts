import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft Potions of Mana and Rejuvenation: drinking regains one expended spell slot of a
 * level up to the potion's maximum (1, 3 or 5; the drinker chooses), and Rejuvenation also heals.
 * Each level is its own "Regain Level N Slot" activity spending the potion and restoring one slot
 * (a negative spell slot consumption); Rejuvenation's healing is the main activity.
 */
export default abstract class _ManaPotion extends DDBEnricherData {

  abstract get maxSlotLevel(): number;

  /** The healing for a Rejuvenation potion, or null for Mana. */
  get healingFormula(): string | null {
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.healingFormula ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.healingFormula) return null;
    return {
      name: "Drink",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      addItemConsume: true,
      data: { healing: DDBEnricherData.basicDamagePart({ customFormula: this.healingFormula, types: ["healing"] }) },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return Array.from({ length: this.maxSlotLevel }, (_, i) => i + 1).map((level) => ({
      init: {
        name: `Regain Level ${level} Slot`,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateTarget: true,
        generateConsumption: true,
        activationOverride: {
          type: this.healingFormula ? "special" : "bonus",
          value: 1,
          condition: this.healingFormula ? "The same drink as the healing" : "",
        },
        targetOverride: { override: true, affects: { type: "self" } },
        consumptionOverride: {
          targets: [
            ...(this.healingFormula ? [] : [{ type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } }]),
            { type: "spellSlots", target: `${level}`, value: "-1", scaling: { mode: "", formula: "" } },
          ],
        },
      },
    }));
  }

}
