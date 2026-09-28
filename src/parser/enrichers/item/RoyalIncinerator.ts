import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Royal Incinerator: Protective Flame is a reaction spending charges to cut an attack's damage by
 * 5 per charge (and burning an adjacent attacker for the same), and a d20 roll of 1 after its last
 * charge destroys the staff in a pillar of flame - a mishap rather than a use, so it spends nothing.
 */
export default class RoyalIncinerator extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Protective Flame", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "5 * @scaling", types: ["fire"] })],
        activationType: "reaction",
        condition: "A creature you can see hits you; reduce the damage by 5 per charge. An attacker within 5 feet takes that much fire damage",
        charges: "1",
        scalingMax: "@item.uses.value",
        noeffect: true,
      }),
      itemProperty("Pillar of Flame", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "17" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, types: ["fire"] })],
        onSave: "half",
        condition: "You expend the last charge and roll a 1 on a d20: the staff is destroyed",
        template: { type: "cylinder", size: "20", height: "80" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
  }

}
