import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Gunnspier: after a hit, a bonus action fires Point Blank Shot for extra bludgeoning (2d8, 3d8 on
 * the Very Rare variant). On the Rare gunnspier double 8s backfire on everyone within 10 feet,
 * the wielder included; the Very Rare variant drops Backfire for Chomp, a bonus action 1d10.
 */
export default class Gunnspier extends WeaponProperties {

  get isVeryRare(): boolean {
    return (/\(Very Rare/i).test(this.recordName);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const veryRare = this.isVeryRare;
    const activities = [
      itemProperty("Point Blank Shot", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: veryRare ? 3 : 2, denomination: 8, types: ["bludgeoning"] })],
        activationType: "bonus",
        condition: "When you hit a target with the loaded gunnspier; reload it with an action",
        noeffect: true,
      }),
    ];
    if (veryRare) {
      activities.push(itemProperty("Chomp", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, types: ["piercing"] })],
        activationType: "bonus",
        condition: "When you hit a target with the gunnspier, as part of the attack",
        noeffect: true,
      }));
    } else {
      activities.push(itemProperty("Backfire", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["piercing"] })],
        condition: "Both Point Blank Shot dice roll an 8: each creature within 10 feet, including you",
        template: { type: "radius", size: "10" },
        range: { value: null, units: "self" },
        noeffect: true,
      }));
    }
    return activities;
  }

}
