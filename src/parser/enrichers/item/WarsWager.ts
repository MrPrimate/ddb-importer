import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * War's Wager: after a hit you can roll a second d20. On 11 or higher the hit becomes a Critical
 * Hit; on 10 or lower the axe scores a Critical Hit against you instead, and that damage ignores
 * Resistance and Immunity. The backfire is its own damage activity against the wielder.
 */
export default class WarsWager extends WeaponProperties {

  static RICOCHET = "Ricochet";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(WarsWager.RICOCHET, DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        selfTarget: true,
        condition: "Your second d20 rolls 10 or lower: the axe scores a Critical Hit against you",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 12, bonus: "@abilities.str.mod + 1", types: ["slashing"] }),
        ],
        noeffect: true,
        data: { damage: { critical: { allow: true } } },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.ignoreDamageReductionEffect("War's Wager: Ricochet", "ALL", {
      conditions: this.selfActivityFilter(WarsWager.RICOCHET),
    });
  }

}
