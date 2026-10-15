import DDBEnricherData from "../data/DDBEnricherData";

export default class PurpleDragonCommandant extends DDBEnricherData {

  /**
   * The modifier of the ability score this feat increased. DDB's modifier only says "choose
   * Strength or Dexterity"; the pick is the feat's choice option. With no pick (or in the muncher),
   * the better of the two stands in.
   */
  get #abilityMod(): string {
    const fallback = "max(@abilities.str.mod, @abilities.dex.mod)";
    if (this.ddbParser.isMuncher) return fallback;
    const choices = this.ddbParser.ddbData?.character?.choices;
    const choice = choices?.feat?.find((c) => c.componentId === this.ddbParser.ddbDefinition.id && c.optionValue);
    if (!choice) return fallback;
    const label = choices.choiceDefinitions
      .find((definition) => definition.id === `${choice.componentTypeId}-${choice.type}`)
      ?.options.find((option) => option.id === choice.optionValue)?.label ?? "";
    if ((/dexterity/i).test(label)) return "@abilities.dex.mod";
    if ((/strength/i).test(label)) return "@abilities.str.mod";
    return fallback;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Encourage Ally",
      activationType: "bonus",
      targetType: "ally",
      targetCount: "1",
      addItemConsume: true,
      data: {
        range: { override: true, value: "30", units: "ft" },
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: this.#abilityMod, types: ["temphp"] }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Last Stand (Bloodied)",
        options: { transfer: true, disabled: true },
        changes: [DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack")],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Encourage Ally", max: "@prof", period: "lr" }),
    };
  }

}
