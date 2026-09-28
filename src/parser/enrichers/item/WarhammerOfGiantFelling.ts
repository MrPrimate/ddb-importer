import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemCheck, itemProperty } from "./_ItemActivities";

/**
 * Warhammer of Giant Felling: a hit forces a Strength save whose outcome depends on the target's
 * size - a larger creature takes 3d6 thunder and falls Prone, one your size or smaller takes 2d6
 * and is Prone and Restrained until a Strength (Athletics) check frees it.
 */
export default class WarhammerOfGiantFelling extends WeaponProperties {

  static LARGER = "Fell: Larger Creature";

  static SMALLER = "Fell: Your Size or Smaller";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(WarhammerOfGiantFelling.LARGER, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["thunder"] })],
        condition: "When you hit a creature larger than you",
      }),
      itemProperty(WarhammerOfGiantFelling.SMALLER, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["thunder"] })],
        condition: "When you hit a creature your size or smaller",
      }),
      itemCheck("Free the Driven Creature", {
        ability: "str",
        skill: "ath",
        dc: "15",
        condition: "The target or a creature within reach of it",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Felled",
        activityMatch: WarhammerOfGiantFelling.LARGER,
        statuses: ["Prone"],
        options: { transfer: false },
      },
      {
        name: "Driven into the Ground",
        activityMatch: WarhammerOfGiantFelling.SMALLER,
        statuses: ["Prone", "Restrained"],
        options: {
          transfer: false,
          description: "Prone and Restrained until a creature succeeds on a DC 15 Strength (Athletics) check as an action to free it.",
        },
      },
    ];
  }

}
