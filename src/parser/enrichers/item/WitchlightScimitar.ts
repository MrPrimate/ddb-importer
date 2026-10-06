import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemActivity, litWeaponEnchantment, noExtraAttackDamage, unrestrictedDamageFormulas, weaponDamageBonus } from "./_ItemActivities";

/**
 * Witchlight Scimitar: a bonus action and the command word make golden radiance spring from the
 * blade, shedding bright light in a 30 foot radius and dim light for another 30 feet; while ablaze
 * it deals an extra 2d6 radiant on a hit, until the word is spoken again or the scimitar is dropped
 * or sheathed. DDB's radiant modifier put the dice on every hit; they are a damage rule on the
 * Witchlight self enchantment instead, whose light is an effect rider on the wielder.
 */
export default class WitchlightScimitar extends WeaponProperties {

  static GLOW = "Witchlight";

  get radiantDice(): string {
    return unrestrictedDamageFormulas(this)[0] ?? "2d6[radiant]";
  }

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity(WitchlightScimitar.GLOW, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationType: "bonus",
        activationCondition: "Speak the command word; the glow lasts until you speak it again or drop or sheathe the scimitar",
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          duration: { value: "", units: "spec", special: "Until you speak the command word again or drop or sheathe the scimitar" },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return litWeaponEnchantment({
      name: "Witchlight Scimitar: Ablaze",
      activity: WitchlightScimitar.GLOW,
      endName: "Douse Witchlight",
      changes: [weaponDamageBonus(this, this.radiantDice)],
      light: { bright: 30, dim: 60, color: "#ffd24a" },
      description: "Golden radiance springs from the blade, shedding Bright Light in a 30-foot radius and Dim Light for an additional 30 feet. It deals an extra 2d6 radiant damage to any target it hits.",
    });
  }

}
