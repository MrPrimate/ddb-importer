import DDBEnricherData from "../data/DDBEnricherData";
import TrickWeapon from "./_TrickWeapon";
import { itemProperty } from "./_ItemActivities";

/**
 * Dream Executioner: a +1 Scythe (and lantern) that transforms into a Maul. While Transformed, a
 * hit while the lantern holds a soul can spend it on Soul Explosion. Harvest (trapping souls in
 * the lantern) stays in the description.
 */
export default class DreamExecutioner extends TrickWeapon {

  get weaponName(): string {
    return "Dream Executioner";
  }

  get transformedCopyName(): string {
    return "Dream Executioner (Maul)";
  }

  override get magicBonus(): number {
    return 1;
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Scythe",
      typeValue: "martialM",
      // Steinhardt's Scythe has no dnd5e base item
      baseItem: "",
      number: 1,
      denomination: 10,
      damageType: "slashing",
      properties: ["fin", "rch", "two"],
      mastery: "cleave",
      range: { value: 10 },
      attackType: "melee",
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
      itemProperty("Soul Explosion", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "14" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["radiant"] }),
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["necrotic"] }),
        ],
        onSave: "half",
        condition: "Transformed: when you hit a creature while the lantern holds a soul, destroying the soul. Creatures of your choice; Undead automatically fail",
        template: { type: "radius", size: "15" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
  }

}
