import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Chitinous Club of c'Naazo: Venomous Spray, a 15 foot cone of poison once per short or long
 * rest - a Dexterity save for 3d6 poison, half on a success.
 */
export default class ChitinousClubOfCNaazo extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Venomous Spray", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "14" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["poison"] })],
        onSave: "half",
        activationType: "action",
        template: { type: "cone", size: "15" },
        range: { value: null, units: "self" },
        uses: { max: "1", period: "sr" },
        noeffect: true,
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
