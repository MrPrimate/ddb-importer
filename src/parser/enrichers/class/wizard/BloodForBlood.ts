import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sangromancer: once per turn, after a Wizard spell deals damage, spend a Hit Point Die (a Wizard's
 * d6) or a Sangromancy Die (a d12 from Full-Blooded) for that much extra damage, rolling twice and
 * keeping the higher against a Bloodied creature.
 */
export default class BloodForBlood extends DDBEnricherData {

  static dieDamage(name: string, die: number, consumption: I5eConsumptionTarget): IDDBActivityData {
    return {
      name,
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once per turn, a Wizard spell you cast damages the creature (roll twice, keep the higher, if it is Bloodied)",
      data: {
        consumption: {
          targets: [consumption],
          scaling: { allowed: false, max: "" },
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: die })],
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return BloodForBlood.dieDamage(
      "Spend a Sangromancy Die",
      12,
      { type: "itemUses", target: "full-blooded", value: "1", scaling: { mode: "", formula: "" } },
    );
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spend a Hit Point Die",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6 })],
        },
        overrides: BloodForBlood.dieDamage(
          "Spend a Hit Point Die",
          6,
          { type: "hitDice", target: "d6", value: "1", scaling: { mode: "", formula: "" } },
        ),
      },
    ];
  }

}
