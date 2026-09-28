import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Sword of Kas: no target makes a save against it. Bloodthirst is the wielder's own Charisma save
 * when the sword goes a minute unblooded (psychic damage on a SUCCESS, domination on a failure),
 * and the DC 18 in the text is the Wish caster's contest to unmake it. Undead take extra slashing.
 */
export default class SwordOfKas extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Undead Bane", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, types: ["slashing"] })],
        condition: "When you hit an Undead",
        noeffect: true,
      }),
      itemProperty("Bloodthirst", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "15" },
        condition: "The sword is not bathed in blood within 1 minute of being drawn. Success: you take 3d6 psychic; failure: you are dominated until its demand is met",
        selfTarget: true,
        noeffect: true,
      }),
    ];
  }

}
