import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, weaponRange } from "./_ItemActivities";

/**
 * Moonsteel weapons (dagger, rapier, and the any-weapon parent): an extra 1d6 radiant on a hit
 * (DDB's modifier, on the attack). A creature hit while not in its true form is frightened until
 * the start of your next turn, which is its own activity, as it needs no save and only applies to
 * shapechangers. At the start of its turn a creature frightened this way makes a DC 13 Charisma
 * save or returns to its true form; the parser builds that save as an action, so it is retimed.
 */
export default class Moonsteel extends WeaponProperties {

  static FRIGHTEN = "Frighten Untrue Form Creature";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(Moonsteel.FRIGHTEN, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "When the weapon hits a creature that is not in its true form",
        range: weaponRange(this),
        noeffect: false,
      }),
      itemProperty("Return to True Form", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "13" },
        condition: "At the start of its turn, a creature frightened by the weapon: on a failure it immediately returns to its true form",
        range: weaponRange(this),
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Moonsteel: Frightened",
        activityMatch: Moonsteel.FRIGHTEN,
        statuses: ["Frightened"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Frightened until the start of the wielder's next turn. At the start of its turn it must succeed on a DC 13 Charisma saving throw or return to its true form.",
        },
      },
    ];
  }

}
