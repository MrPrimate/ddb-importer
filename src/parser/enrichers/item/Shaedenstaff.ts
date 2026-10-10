import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, noExtraAttackDamage, weaponRange } from "./_ItemActivities";

/**
 * Shaedenstaff: a quarterstaff with 15 charges. Annihilating Strike spends a charge on a melee hit
 * for an extra 1d10 necrotic; DDB's restricted modifier put that die on every hit, so it is the
 * strike's own activity. The spells come from DDB's item spells.
 */
export default class Shaedenstaff extends WeaponProperties {

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Annihilating Strike", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, types: ["necrotic"] })],
        condition: "When you hit with a melee attack using the staff, expend 1 charge",
        range: weaponRange(this),
        charges: "1",
        noeffect: true,
      }),
    ];
  }

}
