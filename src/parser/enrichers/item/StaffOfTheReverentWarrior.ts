import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, noExtraAttackDamage, weaponRange } from "./_ItemActivities";

/**
 * Staff of the Reverent Warrior: a +2 quarterstaff whose attacks deal your choice of bludgeoning,
 * piercing or slashing damage. Attuned, you know True Strike, and casting it while holding the
 * staff can spend its 10 charges: 2 to cast it as a bonus action, 1 for advantage on the next
 * attack roll against the target, and 1 on a hit for an extra 1d6 radiant. DDB's restricted
 * modifier put that 1d6 on every hit; each option is its own activity instead.
 */
export default class StaffOfTheReverentWarrior extends WeaponProperties {

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("True Strike: Radiant", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["radiant"] })],
        condition: "When a True Strike cast while holding the staff hits, expend 1 charge",
        range: weaponRange(this),
        charges: "1",
        noeffect: true,
      }),
      itemProperty("True Strike: Bonus Action", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "When you cast True Strike while holding the staff, expend 2 charges to cast it as a Bonus Action",
        selfTarget: true,
        charges: "2",
        noeffect: true,
      }),
      itemProperty("True Strike: Advantage", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "When you cast True Strike while holding the staff, expend 1 charge: the next attack roll made against the target before the end of your next turn has Advantage",
        selfTarget: true,
        charges: "1",
        noeffect: true,
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        // a choice of damage type each time: dnd5e offers every type listed on the base damage
        if (enricher.data.type !== "weapon") return;
        const system = enricher.data.system as I5eWeaponSystemData;
        if (system.damage?.base) system.damage.base.types = ["bludgeoning", "piercing", "slashing"];
      },
    };
  }

}
