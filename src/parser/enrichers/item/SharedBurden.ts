import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Shared Burden: adding your Charisma modifier (minimum 1) to a Warlock spell's damage costs you
 * Psychic damage equal to half that modifier, rounded up, which ignores Resistance and Immunity.
 * The extra spell damage is the caster's choice per hit, so only the cost is an activity.
 */
export default class SharedBurden extends DDBEnricherData {

  static COST = "Shared Burden";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: SharedBurden.COST,
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "You add your Charisma modifier to a Warlock spell's damage",
      noConsumeTargets: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ customFormula: "ceil(max(1, @abilities.cha.mod) / 2)", types: ["psychic"] })],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect("Shared Burden", "psychic", {
      conditions: this.selfActivityFilter(SharedBurden.COST),
    });
  }

}
