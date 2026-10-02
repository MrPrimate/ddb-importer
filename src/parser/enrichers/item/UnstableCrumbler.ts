import DDBEnricherData from "../data/DDBEnricherData";
import TrickWeapon from "./_TrickWeapon";
import { itemProperty } from "./_ItemActivities";

/**
 * Unstable Crumbler: a Cannon that transforms into a Maul. While held, fire damage the wielder
 * takes is reduced by their Constitution modifier (minimum 1).
 *
 * - Cannon: a ranged attack roll of 15 or more overheats the cannonball into an Explosive
 *   Cannonball: each creature within 10 feet of the hit target makes a Dexterity save against
 *   8 + Strength modifier + proficiency or takes 2d8 fire.
 * - Maul: an attack roll of 18 or more detonates the head as Fireball (DC 15) on the target: 8d6
 *   fire in a 20 foot radius, half on a success; the wielder takes nothing on a success.
 *
 * The jump and recoil riders on transforming, and double damage to structures, stay in the
 * description.
 */
export default class UnstableCrumbler extends TrickWeapon {

  get weaponName(): string {
    return "Unstable Crumbler";
  }

  get transformedCopyName(): string {
    return "Unstable Crumbler (Maul)";
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Cannon",
      typeValue: "martialR",
      // Steinhardt's Cannon has no dnd5e base item
      baseItem: "",
      number: 3,
      denomination: 10,
      damageType: "bludgeoning",
      properties: ["amm", "two"],
      mastery: "push",
      range: { value: 120, long: 240 },
      attackType: "ranged",
    };
  }

  get transformed(): ITrickWeaponForm {
    return {
      label: "Maul",
      typeValue: "martialM",
      baseItem: "maul",
      number: 2,
      denomination: 6,
      damageType: "bludgeoning",
      properties: ["hvy", "two"],
      mastery: "topple",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  override get propertyActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Overheated Cannonball", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], calculation: "str" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["fire"] })],
        condition: "Cannon: a ranged attack roll of 15 or higher on the d20 that hits; each creature within 10 feet of the target",
        template: { type: "radius", size: "10" },
        range: { value: "60", units: "ft" },
        noeffect: true,
      }),
      itemProperty("Detonation", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, types: ["fire"] })],
        onSave: "half",
        condition: "Maul: an attack roll of 18 or higher on the d20; Fireball centred on the target. If you succeed on the save you take no damage",
        template: { type: "radius", size: "20" },
        range: { value: "5", units: "ft" },
        noeffect: true,
      }),
    ];
  }

  override get passiveEffects(): IDDBEffectHint[] {
    return [
      {
        name: "Unstable Crumbler: Fire Reduction",
        options: {
          transfer: true,
          description: "While holding the weapon, fire damage you take is reduced by your Constitution modifier (minimum of 1).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-max(@abilities.con.mod, 1)", 20, "system.traits.dm.amount.fire"),
        ],
      },
    ];
  }

}
