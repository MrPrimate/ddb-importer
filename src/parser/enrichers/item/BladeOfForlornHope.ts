import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, noExtraAttackDamage, weaponRange } from "./_ItemActivities";

/**
 * Blade of Forlorn Hope: a +2 scimitar. A hit flares with a burning corona: either an extra 2d6
 * radiant to the target, or 2d6 temporary hit points to one ally within 30 feet of it. Immolating
 * Surge (once per dawn, the item's use) gives an extra action right after an attack on your turn,
 * and you take 6d8 radiant at the end of that turn. DDB lists both dice as plain modifiers, which
 * put them on every hit; they are the corona's choice and the surge's cost instead.
 */
export default class BladeOfForlornHope extends WeaponProperties {

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const tempHp = itemProperty("Burning Corona: Temporary Hit Points", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
      condition: "When you hit a creature with the sword, instead of the radiant damage: one ally you can see within 30 feet of the target",
      range: { value: "30", units: "ft" },
      noeffect: true,
      data: { target: { affects: { type: "ally" } } },
    });
    return [
      itemProperty("Burning Corona: Radiant", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["radiant"] })],
        condition: "When you hit a creature with the sword, instead of granting the temporary hit points",
        range: weaponRange(this),
        noeffect: true,
      }),
      {
        ...tempHp,
        build: {
          ...tempHp.build,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["temphp"] }),
        },
      },
      itemProperty("Immolating Surge", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 6, denomination: 8, types: ["radiant"] })],
        condition: "Immediately after attacking a creature on your turn: take one additional action. You take this damage at the end of the turn, and die if it reduces you to 0 hit points. Once per dawn",
        selfTarget: true,
        charges: "1",
        noeffect: true,
      }),
    ];
  }

}
