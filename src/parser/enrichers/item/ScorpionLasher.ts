import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty, noExtraAttackDamage, weaponRange } from "./_ItemActivities";

/**
 * Scorpion Lasher: once on each of your turns, a hit can deal an extra 1d6 poison. That choice has
 * no rule condition, so the venom is its own damage activity rather than part of every hit. When
 * it does, a Medium or smaller creature makes a DC 13 Strength save or is pulled 5 feet closer;
 * that is the Venom: Pull save, replacing the parser's action-timed copy.
 */
export default class ScorpionLasher extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return noExtraAttackDamage();
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Venom", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["poison"] })],
        condition: "Once on each of your turns when you hit a creature with the whip",
        range: weaponRange(this),
        noeffect: true,
      }),
      itemProperty("Venom: Pull", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "13" },
        condition: "When the venom's extra damage hits a Medium or smaller creature: pulled 5 feet closer to you on a failure",
        range: weaponRange(this),
        noeffect: true,
      }),
    ];
  }

}
