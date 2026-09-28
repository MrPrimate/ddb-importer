import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Astral Sea Piercer: a bonus action and a charge open a rift on a surface (a second one within
 * 300 feet joins them into a portal); a charge on a hit against a Small or larger creature deals
 * 1d8 force and rides a rift on its body, and when a portal opens that creature makes a Charisma
 * save or is shunted through (Large and larger succeed automatically).
 */
export default class AstralSeaPiercer extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Portal Rift", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        condition: "Slam the war pick into a flat, solid surface; a second rift within 300 feet opens a portal until the end of your next turn",
        charges: "1",
        selfTarget: true,
        noeffect: true,
      }),
      itemProperty("Rift Strike", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["force"] })],
        condition: "When you hit a Small or larger creature: a rift attaches to its body",
        charges: "1",
        noeffect: true,
      }),
      itemProperty("Rift Shunt", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "17" },
        condition: "A portal opens to a rift attached to a creature: it is shunted to the other rift on a failure. Large and larger creatures succeed",
        range: { value: "300", units: "ft" },
        noeffect: true,
      }),
    ];
  }

}
