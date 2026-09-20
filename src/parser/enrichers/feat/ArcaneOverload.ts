import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed origin feat. Power Surge adds the proficiency bonus to one damage roll of an
 * Evocation spell once per long rest; the damage type is chosen when rolled.
 */
export default class ArcaneOverload extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Power Surge",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you cast an Evocation spell and deal damage with it: add to one damage roll",
      addItemConsume: true,
      noTemplate: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ bonus: "@prof", types: DDBEnricherData.allDamageTypes(), scalingMode: "none" }),
      ],
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Arcane Overload: Power Surge",
        max: "1",
        period: "lr",
      }),
    };
  }

}
