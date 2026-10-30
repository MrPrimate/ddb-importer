import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Purification Domain: Lesser and Greater Restoration cast on a willing creature without a slot
 * cost that creature 1d6 Fire damage per level of the spell, which ignores Resistance and Immunity.
 * The casts are spell grants, so the feature carries the cost: one damage activity per spell.
 */
export default class SearImperfections extends DDBEnricherData {

  static cost(spell: string, level: number): IDDBActivityData {
    return {
      name: `Searing Cost: ${spell}`,
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: `Immediately after you cast ${spell} with this feature`,
      noConsumeTargets: true,
      data: {
        range: { override: true, value: null, units: "touch" },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: level, denomination: 6, types: ["fire"] })],
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return SearImperfections.cost("Lesser Restoration", 2);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Searing Cost: Greater Restoration", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
        },
        overrides: SearImperfections.cost("Greater Restoration", 5),
      },
    ];
  }

  // the fire damage of both costs ignores Resistance and Immunity
  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect("Sear Imperfections", "fire", {
      conditions: this.selfIdentifierFilter,
    });
  }

}
