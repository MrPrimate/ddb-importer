import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Shooting Star: Falling Stars rains stars on a 30 foot circle within 60 feet once per dusk (the
 * parser reads that limit onto the item's uses), and a natural 20 with a starlit arrow calls a
 * single star down on the target. Both are Dexterity saves for half.
 */
export default class ShootingStar extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Falling Stars", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "16" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["radiant"] }),
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["force"] }),
        ],
        onSave: "half",
        activationType: "action",
        condition: "Speak the command word and fire a starlit arrow above you; creatures of your choice in the area",
        template: { type: "radius", size: "30" },
        range: { value: "60", units: "ft" },
        charges: "1",
        noeffect: true,
      }),
      itemProperty("Starlit Critical", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "16" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["radiant"] }),
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["force"] }),
        ],
        onSave: "half",
        condition: "You roll a 20 on an attack roll with a starlit arrow",
        range: { value: "150", units: "ft" },
        noeffect: true,
      }),
    ];
  }

}
