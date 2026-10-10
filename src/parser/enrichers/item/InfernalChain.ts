import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, weaponRange } from "./_ItemActivities";

/**
 * Infernal Chain: a heavy reach chain with an extra 1d8 fire on a hit (DDB's modifier, on the
 * attack). A creature it grapples takes 2d8 fire at the start of each of its turns, which DDB
 * restricts to "When target is grappled" and the parser builds as a second attack; it is a damage
 * activity instead, beside the bonus action pull. The curse compels the attuned wielder to attack
 * a celestial within 30 feet on a failed Wisdom save at the start of each of their turns.
 */
export default class InfernalChain extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Grappled: Burning Chain", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["fire"] })],
        condition: "At the start of each turn of the creature grappled by the chain",
        range: weaponRange(this),
        noeffect: true,
      }),
      itemProperty("Grappled: Pull", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        condition: "Pull the creature grappled by the chain 5 feet toward you",
        range: weaponRange(this),
        noeffect: true,
      }),
      itemProperty("Curse", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], formula: "16" },
        condition: "At the start of each of your turns while cursed and aware of a celestial within 30 feet of you: on a failure you must use your action to attack the nearest celestial",
        selfTarget: true,
        noeffect: true,
      }),
    ];
  }

}
