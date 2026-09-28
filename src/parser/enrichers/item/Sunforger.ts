import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Sunforger: an action hurls it up to 120 feet to explode in a 20 foot sphere - a Dexterity save
 * for 6d6 fire, half on a success - once per short or long rest; another action calls it back.
 */
export default class Sunforger extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Solar Explosion", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, types: ["fire"] })],
        onSave: "half",
        activationType: "action",
        condition: "Hurl the weapon to a point you can see; it vanishes in the explosion",
        template: { type: "sphere", size: "20" },
        range: { value: "120", units: "ft" },
        uses: { max: "1", period: "sr" },
        noeffect: true,
      }),
      itemProperty("Recall", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        condition: "The weapon reappears in your empty hand",
        selfTarget: true,
        noeffect: true,
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return this.noItemUses;
  }

}
