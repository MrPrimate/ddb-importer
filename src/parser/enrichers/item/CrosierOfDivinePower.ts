import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, noExtraAttackDamage, weaponRange } from "./_ItemActivities";

/**
 * Crosier of Divine Power: a +3 quarterstaff that gathers radiant motes (2 when you roll
 * initiative against an enemy, another on a 6 at the start of each of your turns in combat, each
 * lasting 1 minute). Spending a mote adds 2d6 radiant to a hit with the staff, or 2d6 to the hit
 * points a spell or magical effect heals while you hold it. DDB's restricted modifier put the 2d6
 * on every hit; each use is its own activity instead. The motes themselves are not tracked.
 */
export default class CrosierOfDivinePower extends WeaponProperties {

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const healing = itemProperty("Radiant Mote: Healing", DDBEnricherData.ACTIVITY_TYPES.HEAL, {
      condition: "When you heal a creature with a spell or magical effect while holding the staff, expend a mote: add 2d6 to the hit points healed",
      range: { value: null, units: "spec" },
      noeffect: true,
    });
    return [
      itemProperty("Radiant Mote: Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["radiant"] })],
        condition: "When you hit a target with the staff, expend a mote",
        range: weaponRange(this),
        noeffect: true,
      }),
      {
        ...healing,
        build: {
          ...healing.build,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["healing"] }),
        },
      },
    ];
  }

}
