import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Coven Patron (OTFY). DDB ships the feature twice and merges the chosen "Spell Swap: Level N"
 * option into one copy, so one document carries Borrowed Talent and the other the Spell Swap
 * ritual, each with its own once per Long Rest use (DDB puts both actions in one shared pool).
 */
export default class CollectiveKnowledge extends DDBEnricherData {

  get isSpellSwap(): boolean {
    return this.data.name.includes("Spell Swap")
      || this.ddbParser.originalName.includes("Spell Swap")
      || (this.ddbParser._chosen ?? []).some((choice) => (choice.label ?? "").startsWith("Spell Swap"));
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isSpellSwap) {
      return {
        name: "Ritual: Spell Swap",
        activationType: "minute",
        activationValue: 10,
        activationCondition: "Swap a prepared Warlock spell for a Druid or Wizard spell until a Long Rest, and cast it once without a slot",
        addItemConsume: true,
        targetType: "self",
      };
    }
    return {
      name: "Borrowed Talent",
      activationType: "special",
      activationCondition: "An ability check with a skill or tool you lack proficiency in (no action), or a Magic action to learn a language, until a Long Rest",
      addItemConsume: true,
      targetType: "self",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: this.isSpellSwap ? "Ritual: Spell Swap" : "Borrowed Talent",
        max: "1",
        period: "lr",
      }),
    };
  }

}
