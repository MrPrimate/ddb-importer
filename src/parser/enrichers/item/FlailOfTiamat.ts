import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Flail of Tiamat: a hit deals an extra 5d4 of ONE chromatic type of the wielder's choice (DDB
 * ships five 5d4 modifiers, one per type), and once per dawn the heads breathe a 90 foot cone
 * of one of those types.
 */
export default class FlailOfTiamat extends WeaponProperties {

  static TYPES = ["acid", "cold", "fire", "lightning", "poison"];

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: 5, denomination: 4, types: FlailOfTiamat.TYPES })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Multicolored Breath", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "18" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 14, denomination: 6, types: FlailOfTiamat.TYPES })],
        onSave: "half",
        activationType: "action",
        condition: "Speak a command word; one damage type of your choice",
        template: { type: "cone", size: "90" },
        range: { value: null, units: "self" },
        charges: "1",
        noeffect: true,
      }),
    ];
  }

}
