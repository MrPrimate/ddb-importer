import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Ionbreaker, the Tempest's Reach: Discharge arcs 1d8 lightning into the target and every creature
 * within 5 feet of it on a hit; a hit also makes the target a conduit, and a bonus action
 * electrifies all conduits within 60 feet - each takes 2d8 lightning with no save, and every
 * other creature in the 5 foot lines between them makes a Dexterity save for 2d8, half on a
 * success. The bow's destruction is scenery.
 */
export default class Ionbreaker extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Discharge", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["lightning"] })],
        condition: "Immediately after you hit with a ranged attack on your turn: the target and other creatures within 5 feet of it, once per creature until the start of your next turn",
        template: { type: "radius", size: "5" },
        range: { value: "150", units: "ft" },
        noeffect: true,
      }),
      itemProperty("Chained Conduits: Conduits", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["lightning"] })],
        activationType: "bonus",
        condition: "Every conduit (a creature you hit in the last minute) within 60 feet",
        targetCount: "",
        range: { value: "60", units: "ft" },
        noeffect: true,
      }),
      itemProperty("Chained Conduits: Lines", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "18" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["lightning"] })],
        onSave: "half",
        condition: "Part of the same bonus action: other creatures in a 5 foot line between conduits within 30 feet of each other",
        targetCount: "",
        range: { value: "60", units: "ft" },
        noeffect: true,
      }),
    ];
  }

}
