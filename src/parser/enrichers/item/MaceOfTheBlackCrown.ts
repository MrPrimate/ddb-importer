import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemActivity, litWeaponEnchantment, noExtraAttackDamage, unrestrictedDamageFormulas, weaponDamageBonus } from "./_ItemActivities";

/**
 * Mace of the Black Crown, a staged artifact (Dormant, Awakened, Exalted; the unsuffixed record
 * carries the exalted text). A bonus action and its Infernal command word set the head ablaze,
 * shedding bright light in a 40 foot radius and dim light for another 40 feet; while ablaze it
 * deals an extra 1d6 fire on a hit (2d6 awakened, 3d6 exalted) until the word is spoken again or
 * you let go of it. DDB's fire modifier put the die on every hit; it is a damage rule on the
 * Ignite self enchantment instead, whose light is an effect rider on the wielder. The unsuffixed
 * record's modifier has no dice and no magical bonus, so both come from the stage.
 */
export default class MaceOfTheBlackCrown extends WeaponProperties {

  static IGNITE = "Ignite";

  get fireDice(): string {
    return unrestrictedDamageFormulas(this)[0] ?? `${this.stage + 1}d6[fire]`;
  }

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity(MaceOfTheBlackCrown.IGNITE, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationType: "bonus",
        activationCondition: "While holding the mace, speak its Infernal command word; the flames last until you speak it again or let go of the mace",
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          // lasts until the word is spoken again, so the activity must not cap the enchantment
          duration: { value: "", units: "spec", special: "Until you speak the command word again or let go of the mace" },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return litWeaponEnchantment({
      name: "Mace of the Black Crown: Ablaze",
      activity: MaceOfTheBlackCrown.IGNITE,
      endName: "Extinguish",
      changes: [weaponDamageBonus(this, this.fireDice)],
      light: { bright: 40, dim: 80, color: "#ff7a1a", animation: "torch" },
      description: `Flames erupt from the mace's head, shedding Bright Light in a 40-foot radius and Dim Light for an additional 40 feet. It deals an extra ${this.fireDice.replace("[fire]", "")} fire damage to any target it hits.`,
    });
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        // the unsuffixed record carries no magical bonus modifier
        if (enricher.data.type === "weapon" && !foundry.utils.getProperty(enricher.data, "system.magicalBonus")) {
          foundry.utils.setProperty(enricher.data, "system.magicalBonus", this.stage + 1);
        }
      },
    };
  }

}
