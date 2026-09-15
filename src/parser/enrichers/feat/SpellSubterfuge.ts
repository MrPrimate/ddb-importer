import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Shrouding Spells: Dash and Hide as one bonus action after casting
 * an action spell with a slot, spellcasting-modifier uses per long rest (DDB records no uses; the
 * feat raises a spellcasting score, whose modifier sets the count). Sneaky Casting is text only.
 */
export default class SpellSubterfuge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shrouding Spells",
      targetType: "self",
      activationType: "bonus",
      activationCondition: "After you cast a spell with a casting time of an action using a spell slot: take the Dash and Hide actions",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "max(1, @attributes.spell.mod)",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
