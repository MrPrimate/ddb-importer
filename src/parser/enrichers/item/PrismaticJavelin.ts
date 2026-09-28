import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Prismatic Javelin: once per dawn it erupts at a point within 120 feet; each creature of your
 * choice in the 20 foot bright light makes a Dexterity save or takes 2d10 of the type a d6 beam
 * table gives it (a 6 is two beams). There is no half on a success.
 */
export default class PrismaticJavelin extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Prismatic Burst", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "13" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, types: ["fire", "acid", "lightning", "poison", "cold"] })],
        activationType: "action",
        condition: "Throw the javelin at a point and use a command word. Roll 1d6 per target: 1 fire, 2 acid, 3 lightning, 4 poison, 5 cold, 6 two beams (reroll 6s)",
        template: { type: "radius", size: "20" },
        range: { value: "120", units: "ft" },
        charges: "1",
        noeffect: true,
      }),
    ];
  }

}
