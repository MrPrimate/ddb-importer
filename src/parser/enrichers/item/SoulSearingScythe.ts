import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemActivity, itemProperty, litWeaponEnchantment, noExtraAttackDamage, weaponDamageBonus, weaponRange } from "./_ItemActivities";

/**
 * Soul-Searing Scythe: a +2 scythe. A bonus action and its command word set the blade ablaze,
 * shedding bright light in a 40 foot radius and dim light for another 40 feet; while ablaze it
 * deals an extra 3d4 fire on a hit (ignoring fire resistance and immunity, necrotic against Fire
 * Absorption), until the word is spoken again or the scythe is dropped or stowed. A critical hit
 * against a creature that is not a construct or undead forces a DC 17 Constitution save: 3d4
 * necrotic and stunned until the start of your next turn, half and not stunned on a success. DDB's
 * restricted modifiers made both attacks of their own; the fire is the Ignite self enchantment's
 * damage rule and the critical hit is its own save.
 */
export default class SoulSearingScythe extends WeaponProperties {

  static IGNITE = "Ignite";

  static SEAR = "Crit vs Living Creatures";

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity(SoulSearingScythe.IGNITE, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationType: "bonus",
        activationCondition: "While holding the scythe, speak its command word; the flames last until you speak it again or drop or stow the scythe",
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          duration: { value: "", units: "spec", special: "Until you speak the command word again or drop or stow the scythe" },
        },
      }),
      itemProperty(SoulSearingScythe.SEAR, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "17" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 4, types: ["necrotic"] })],
        onSave: "half",
        condition: "When you score a critical hit with the scythe against a creature that is not a construct or undead",
        range: weaponRange(this),
        noeffect: false,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      ...litWeaponEnchantment({
        name: "Soul-Searing Scythe: Ablaze",
        activity: SoulSearingScythe.IGNITE,
        endName: "Extinguish",
        changes: [weaponDamageBonus(this, "3d4[fire]")],
        light: { bright: 40, dim: 80, color: "#ff7a1a", animation: "torch" },
        description: "Soul-rending flames erupt from the blade, shedding Bright Light in a 40-foot radius and Dim Light for an additional 40 feet. It deals an extra 3d4 fire damage to any target it hits, ignoring fire resistance and immunity; the damage is necrotic against a creature with the Fire Absorption trait.",
      }),
      {
        name: "Soul-Searing Scythe: Stunned",
        activityMatch: SoulSearingScythe.SEAR,
        statuses: ["Stunned"],
        options: { transfer: false, durationSeconds: null, expiry: "sourceStart" },
      },
    ];
  }

}
