import DDBEnricherData from "../data/DDBEnricherData";

const RESISTANCES = ["Necrotic", "Psychic", "Radiant", "Thunder"];

export default class SpellResistant extends DDBEnricherData {

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
      name: "Magic Resistant",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you would fail a save against a spell or magical effect",
      addItemConsume: true,
      data: {
        roll: { name: "Save Bonus", formula: "1d6", prompt: false, visible: true },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const chosen = this.ddbParser.isMuncher
      ? ""
      : (this.ddbParser._chosen?.map((a) => a.label).join("|") ?? "");
    return RESISTANCES.map((type) => ({
      name: `Magical Resilience: ${type}`,
      options: { transfer: true, disabled: !chosen.includes(type) },
      changes: [DDBEnricherData.ChangeHelper.damageResistanceChange(type)],
    }));
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Magic Resistant",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
