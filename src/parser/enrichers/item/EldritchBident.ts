import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Eldritch Bident: for a warlock, a natural 20 with an eldritch beam shunts the target to a plane
 * of horrors on a failed Charisma save. It is Incapacitated there until the start of your next
 * turn, when it takes 2d12 psychic and returns - damage its return deals, not the save.
 */
export default class EldritchBident extends WeaponProperties {

  static SHUNT = "Eldritch Shunt";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(EldritchBident.SHUNT, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "10" },
        condition: "A warlock rolls a 20 on an eldritch beam attack against a creature",
        range: { value: "60", units: "ft" },
      }),
      itemProperty("Eldritch Shunt: Return", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["psychic"] })],
        condition: "At the start of your next turn the shunted creature reappears",
        range: { value: "60", units: "ft" },
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shunted",
        activityMatch: EldritchBident.SHUNT,
        statuses: ["Incapacitated"],
        options: { transfer: false, expiry: "sourceStart", durationSeconds: 6, durationRounds: 1, description: "Shunted to a plane of eldritch horrors until the start of the bident wielder's next turn." },
      },
    ];
  }

}
