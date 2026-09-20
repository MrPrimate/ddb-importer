import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../data/RegionBuilders";

/**
 * Spilling the oil rolls nothing: it places a 10-foot-radius patch of difficult terrain whose
 * region fires the slip save against a creature that enters it or starts its turn there. The
 * fire damage only matters once something ignites the oil, so it is a manual roll and the region
 * does not fire it.
 */
export default class WarOil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Spill War Oil", {
      template: { type: "circle", size: "10" },
      rangeSpecial: "Where the alchemical ammunition lands (attack against AC 10)",
      duration: { value: "1", units: "minute" },
      consume: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.difficultTerrain(),
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "War Oil Slip Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("War Oil Slip Save", {
        condition: "Enters the coated area for the first time on a turn or starts its turn there",
        save: { ability: ["dex"], dc: "10" },
      }),
      regionTrigger("Burning War Oil Damage", {
        condition: "If ignited (burns for 2 rounds): touches the burning oil, and again if it ends its turn in contact",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["fire"] }),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "War Oil Slip Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
      {
        name: "War Oil: Speed 0",
        activityMatch: "War Oil Slip Save",
        changes: [DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50)],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Speed 0 until the end of its turn.",
        },
      },
    ];
  }

}
