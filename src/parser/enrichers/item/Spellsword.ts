import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Spellsword: deactivating the blade early with an action erupts its stored magic in a 10 foot
 * cone - a Dexterity save for 3d6 force, half on a success, rising to 4d8 when activated with a
 * 3rd or 4th level slot and 5d10 with 5th or higher.
 */
export default class Spellsword extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Deactivation Wave", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["force"] })],
        onSave: "half",
        activationType: "action",
        condition: "Deactivate the sword early. 4d8 if activated with a 3rd or 4th level slot, 5d10 with 5th or higher",
        template: { type: "cone", size: "10" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
  }

}
