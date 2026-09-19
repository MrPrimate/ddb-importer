import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "./_ItemRegions";

/**
 * Spreading the caltrops rolls nothing: it places a 5-foot square whose region fires the save
 * against a creature that enters. A failure spends the caltrops in a burst that lifts the
 * creature into the air, so the save carries both damage parts and the levitation rider.
 */
export default class AstralCaltrops extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Spread Caltrops", {
      template: { type: "square", size: "5" },
      range: "5",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter"],
          activityName: "Astral Caltrops Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Astral Caltrops Save", {
        condition: "Enters the area; the caltrops are destroyed on a failed save",
        save: { ability: ["dex"], dc: "15" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ bonus: "1", types: ["piercing"] }),
          DDBEnricherData.basicDamagePart({ number: 6, denomination: 6, types: ["force"] }),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Astral Caltrops: Suspended",
        activityMatch: "Astral Caltrops Save",
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50)],
        daeSpecialDurations: ["isDamaged"],
        options: {
          transfer: false,
          durationSeconds: 24,
          description: "Stops moving, then rises up to 20 feet and hangs there with a Speed of 0 for 1d4 rounds. The effect ends early if the creature takes any damage.",
        },
      },
    ];
  }

}
