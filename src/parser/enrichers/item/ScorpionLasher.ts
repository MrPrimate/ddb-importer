import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty, noExtraAttackDamage } from "./_ItemActivities";

/**
 * Scorpion Lasher: once on each of your turns, a hit can deal an extra 1d6 poison, so the venom is
 * its own damage activity rather than part of every hit; the parser's Strength save rider pulls a
 * Medium or smaller creature.
 */
export default class ScorpionLasher extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return noExtraAttackDamage();
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Venom", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["poison"] })],
        condition: "Once on each of your turns when you hit a creature with the whip",
        noeffect: true,
      }),
    ];
  }

}
