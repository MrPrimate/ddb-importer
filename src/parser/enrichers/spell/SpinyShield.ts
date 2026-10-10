import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The cast raises the barrier on the caster until their next turn. Each melee hit then uses the
 * free Damage activity against the attacker: the same 2d4 roll is the damage reduction the caster
 * applies to the hit. The half cover against ranged attacks is an AC5e penalty to incoming
 * ranged attack rolls.
 */
export default class SpinyShield extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shield",
      targetType: "self",
      rangeSelf: true,
      overrideTarget: true,
      overrideRange: true,
      noTemplate: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          noeffect: true,
          generateTarget: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 4,
              type: "piercing",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
          targetOverride: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: {
            type: "special",
            condition: "When hit by a melee attack, reduce the damage by this roll and deal it to the attacker",
          },
        },
        overrides: {
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spiny Shield",
        activityMatch: "Shield",
        options: {
          expiry: "sourceStart",
          description: "Until the start of your next turn, melee hits against you deal 2d4 less damage and deal that much piercing damage to the attacker. Ranged attacks against you take a -2 penalty (half cover).",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=-2; actionType.rwak || actionType.rsak",
            20,
            "flags.automated-conditions-5e.grants.attack.bonus",
          ),
        ],
      },
    ];
  }

}
