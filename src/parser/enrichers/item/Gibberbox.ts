import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "./_ItemRegions";

/**
 * Opening the lid rolls nothing: it places a 20-foot emanation for 1 minute, once per 24 hours,
 * whose region fires the save against any creature that starts its turn inside, the holder
 * included. The emanation follows whoever opened the box, so a box that is set down needs its
 * region moved by hand.
 */
export default class Gibberbox extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Open the Lid", {
      template: { type: "radius", size: "20" },
      duration: { value: "1", units: "minute" },
      uses: { spent: 0, max: "1", recovery: [{ period: "day", type: "recoverAll" }] },
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenTurnStart"],
          activityName: "Babbling Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Babbling Save", {
        condition: "Starts its turn within 20 feet of the open box and can hear it",
        save: { ability: ["wis"], dc: "10" },
      }),
      regionTrigger("Babbling Behavior", {
        condition: "Failed the Babbling Save: 1-4 does nothing, 5-6 moves in a random direction, 7-8 makes a melee attack against a random creature in reach",
        roll: { prompt: false, visible: false, name: "Babbling Behavior", formula: "1d8" },
      }),
      regionTrigger("Touch the Paste", {
        condition: "Touches the paste and mouth while the box is open and babbling",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["piercing"] }),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Gibberbox: Babbling",
        activityMatch: "Babbling Save",
        options: {
          transfer: false,
          expiry: "targetStart",
          description: "Can't make Opportunity Attacks until the start of its next turn, and its current turn is decided by the Babbling Behavior roll.",
        },
      },
    ];
  }

}
