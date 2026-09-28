import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Nightmare Staff: a reaction and a charge when a creature within 60 feet damages you force an
 * Intelligence save or Frightened until the end of its next turn; a creature already Frightened
 * also takes 2d6 psychic.
 */
export default class NightmareStaff extends WeaponProperties {

  static PHANTASM = "Phantasm";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(NightmareStaff.PHANTASM, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["int"], formula: "13" },
        activationType: "reaction",
        condition: "A creature you can see within 60 feet damages you while you hold the staff",
        range: { value: "60", units: "ft" },
        charges: "1",
      }),
      itemProperty("Phantasm: Psychic", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["psychic"] })],
        condition: "The creature fails the save while already Frightened",
        range: { value: "60", units: "ft" },
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Phantasm",
        activityMatch: NightmareStaff.PHANTASM,
        statuses: ["Frightened"],
        options: { transfer: false, expiry: "targetEnd" },
      },
    ];
  }

}
