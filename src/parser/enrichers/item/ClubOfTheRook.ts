import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Club of the Rook: once per dawn, an action barrels you up to 30 feet in a line; each creature
 * you pass through makes a Strength save: 3d4 bludgeoning and Prone on a failure, half on a
 * success.
 */
export default class ClubOfTheRook extends WeaponProperties {

  static CHARGE = "Rook's Charge";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(ClubOfTheRook.CHARGE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "13" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 4, types: ["bludgeoning"] })],
        onSave: "half",
        activationType: "action",
        condition: "Move up to 30 feet in a line, barreling through creatures no more than one size larger than you",
        template: { type: "line", size: "30", width: "5" },
        range: { value: null, units: "self" },
        charges: "1",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{ name: "Barreled Over", activityMatch: ClubOfTheRook.CHARGE, statuses: ["Prone"], options: { transfer: false } }];
  }

}
