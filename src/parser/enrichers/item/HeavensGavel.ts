import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Heaven's Gavel: on a hit against a creature no more than one size larger, up to 3 charges
 * launch it 10 feet per charge on a failed Strength save (half as far on a success). Hitting a
 * solid object deals 1d6 bludgeoning per 10 feet left to travel, to it and to a creature it hits.
 * Evil creatures take an extra 1d6 radiant.
 */
export default class HeavensGavel extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Launch", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "17" },
        condition: "When you hit a creature no more than one size larger than you: launched 10 feet per charge (half on a success)",
        charges: "1",
        scalingMax: "3",
        noeffect: true,
      }),
      itemProperty("Launch: Impact", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "1d6", types: ["bludgeoning"] })],
        condition: "The launched creature hits a solid object: 1d6 per 10 feet it had left to travel, also to a creature it hits",
        noeffect: true,
      }),
      itemProperty("Holy Strike", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["radiant"] })],
        condition: "When you hit an evil-aligned creature",
        noeffect: true,
      }),
    ];
  }

}
