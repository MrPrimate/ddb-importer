import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Dragon's Wrath Weapon: its damage type is the breath weapon of the dragon whose hoard it
 * steeped in, so every part offers the breath types to choose from at roll time. By tier:
 * Slumbering deals 5 to creatures of your choice within 5 feet of the target on a natural 20;
 * Stirring adds 1d6 on a hit (2d6 Wakened, 3d6 Ascendant); Wakened unleashes a 30 foot cone,
 * DC 16, 8d6, once per dawn, which Ascendant widens to 60 feet, DC 18, 12d6.
 */
export default class DragonsWrathWeapon extends WeaponProperties {

  static TYPES = ["acid", "cold", "fire", "lightning", "poison", "force", "necrotic", "psychic", "radiant", "thunder"];

  /** 0 Slumbering, 1 Stirring, 2 Wakened, 3 Ascendant; the unsuffixed record is Slumbering. */
  get tier(): number {
    const match = (/\((Slumbering|Stirring|Wakened|Ascendant)\)/i).exec(this.recordName);
    return match ? ["slumbering", "stirring", "wakened", "ascendant"].indexOf(match[1].toLowerCase()) : 0;
  }

  override get activity(): IDDBActivityData {
    if (this.tier < 1) return { noeffect: true };
    return {
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [DDBEnricherData.basicDamagePart({ number: this.tier, denomination: 6, types: DragonsWrathWeapon.TYPES })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities = [
      itemProperty("Wrathful Burst", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ bonus: "5", types: DragonsWrathWeapon.TYPES })],
        condition: "You roll a 20 on an attack roll with the weapon: each creature of your choice within 5 feet of the target",
        template: { type: "radius", size: "5" },
        noeffect: true,
      }),
    ];
    if (this.tier >= 2) {
      const ascendant = this.tier >= 3;
      activities.push(itemProperty("Cone of Destructive Energy", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: ascendant ? "18" : "16" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: ascendant ? 12 : 8, denomination: 6, types: DragonsWrathWeapon.TYPES })],
        onSave: "half",
        activationType: "action",
        condition: "The damage type of the dragon's breath weapon",
        template: { type: "cone", size: ascendant ? "60" : "30" },
        range: { value: null, units: "self" },
        charges: "1",
        noeffect: true,
      }));
    }
    return activities;
  }

}
