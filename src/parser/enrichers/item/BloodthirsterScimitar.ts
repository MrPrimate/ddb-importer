import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemActivity, itemProperty, noExtraAttackDamage, weaponDamageBonus } from "./_ItemActivities";

/**
 * Bloodthirster Scimitar: resistance to necrotic damage while held. Forgoing an attack of the
 * Attack action to sacrifice blood deals you 1d6 + 3 piercing (ignoring resistance and immunity)
 * and empowers the sword for 1 minute: a cumulative +1 to attack and damage rolls (to +3) and an
 * extra 1d6 necrotic on a hit. DDB lists the 1d6 as a plain modifier, which put it on every hit;
 * it belongs to the empowerment, a self enchantment whose profiles are the +1, +2 and +3 steps.
 */
export default class BloodthirsterScimitar extends WeaponProperties {

  static SACRIFICE = "Blood Sacrifice";

  static EMPOWER = "Empowered";

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(BloodthirsterScimitar.SACRIFICE, DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, bonus: "3", types: ["piercing"] })],
        condition: "When you take the Attack action, forgo one of your attacks; this damage ignores resistance and immunity. Then apply or raise the empowerment",
        selfTarget: true,
        noeffect: true,
      }),
      itemActivity(BloodthirsterScimitar.EMPOWER, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationCondition: "After a Blood Sacrifice: choose the cumulative bonus (+1 per sacrifice, to a maximum of +3)",
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          duration: { value: "1", units: "minute" },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const helper = DDBEnricherData.ChangeHelper;
    return [
      {
        name: "Bloodthirster: Necrotic Resistance",
        changes: [helper.damageResistanceChange("necrotic")],
        options: { transfer: true, durationSeconds: null, expiry: null, description: "While you hold the sword, you have resistance to necrotic damage." },
      },
      ...[1, 2, 3].map((bonus): IDDBEffectHint => ({
        type: "enchant",
        name: `Bloodthirster: Empowered +${bonus}`,
        activityMatch: BloodthirsterScimitar.EMPOWER,
        changes: [
          helper.ruleBonusChange("attack", `${bonus}`, { conditions: [helper.WEAPON_ATTACK_FILTER] }),
          weaponDamageBonus(this, `${bonus}`),
          weaponDamageBonus(this, "1d6[necrotic]"),
          // choosing another step replaces this one; choosing it again ends the empowerment
          helper.overrideChange("Change or End Empowerment", 20, "activities[enchant].name"),
        ],
        options: {
          transfer: false,
          durationSeconds: 60,
          expiry: null,
          description: `Empowered by blood: +${bonus} to attack and damage rolls with the sword, which deals an extra 1d6 necrotic damage to any target it hits, for 1 minute.`,
        },
      })),
    ];
  }

}
