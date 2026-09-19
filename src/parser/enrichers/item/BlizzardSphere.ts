import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "./_ItemRegions";

/**
 * Shattering the sphere rolls nothing: it places a 20-foot-radius blizzard for 1d4 rounds that is
 * icy difficult terrain, and its region fires the save against a creature that enters it or starts
 * its turn there.
 */
export default class BlizzardSphere extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Throw", {
      template: { type: "sphere", size: "20" },
      range: "30",
      duration: { units: "spec", special: "1d4 rounds" },
      behaviors: [
        DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Blizzard Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Blizzard Save", {
        condition: "Enters the blizzard for the first time on a turn or starts its turn there",
        save: { ability: ["con"], dc: "15" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, types: ["cold"] }),
        ],
        onSave: "half",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blizzard: Speed Halved",
        activityMatch: "Blizzard Save",
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5", 50)],
        options: {
          transfer: false,
          expiry: "targetStart",
          description: "Speed halved until the start of its next turn.",
        },
      },
    ];
  }

}
