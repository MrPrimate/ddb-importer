import { DICTIONARY } from "../../../config/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class PurpleDragonCommandant extends DDBEnricherData {

  // the ability score increased by this feat (Strength or Dexterity)
  get #ability(): string {
    if (this.ddbParser.isMuncher) return "str";
    const modId = this.ddbParser.ddbData.character.modifiers.feat.find((mod) =>
      mod.type === "bonus"
      && mod.componentId === this.ddbParser.ddbDefinition.componentId,
    )?.entityId;
    const ability = DICTIONARY.actor.abilities.find((ability) => ability.id === modId)?.value;
    return ability === "dex" ? "dex" : "str";
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
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: `@abilities.${this.#ability}.mod`, types: ["temphp"] }),
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
