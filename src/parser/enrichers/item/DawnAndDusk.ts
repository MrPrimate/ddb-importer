import DDBEnricherData from "../data/DDBEnricherData";
import TrickWeapon from "./_TrickWeapon";

/**
 * Dawn and Dusk: a +1 Light weapon that becomes a Mace at dawn (an extra 1d4 Radiant on a hit)
 * and a Sickle at dusk (an extra 1d6 Necrotic instead). Not a trick weapon in the strict sense, but
 * DDB ships it the same way, and the change is the Transform activity used at dusk and again at
 * dawn. The weapon has no other damage activity, so the Sickle can replace the attack's extra part.
 */
export default class DawnAndDusk extends TrickWeapon {

  get weaponName(): string {
    return "Dawn and Dusk";
  }

  get transformedCopyName(): string {
    return "Dawn and Dusk (Sickle)";
  }

  override get magicBonus(): number {
    return 1;
  }

  override get sharedProperties(): string[] {
    return ["lgt"];
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Mace",
      typeValue: "simpleM",
      baseItem: "mace",
      number: 1,
      denomination: 6,
      damageType: "bludgeoning",
      properties: [],
      mastery: "sap",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  get transformed(): ITrickWeaponForm {
    return {
      label: "Sickle",
      typeValue: "simpleM",
      baseItem: "sickle",
      number: 1,
      denomination: 4,
      damageType: "slashing",
      properties: [],
      mastery: "nick",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  override get untransformedAttackParts(): I5eDamagePart[] {
    return [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["radiant"] })];
  }

  // dnd5e applies a system.damage.parts enchantment change to every attack, damage and save
  // activity's parts; the attack is the only one here, so the override swaps its Radiant for Necrotic
  override get transformedChanges(): IActiveEffectChangeData[] {
    return [DDBEnricherData.ChangeHelper.overrideChange(`[["1d6", "necrotic"]]`, 20, "system.damage.parts")];
  }

  override get transformActivation(): { type: TActivationCost; condition: string } {
    return { type: "special", condition: "At dusk it becomes a Sickle; at dawn, use it again to return to the Mace" };
  }

}
