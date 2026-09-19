import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "./_ItemRegions";

/**
 * The vapor lingers for 2 rounds but what it does to a creature lasts a minute, even after the
 * creature leaves, so the region fires an activity that applies the effect instead of applying
 * it only while inside. Losing Resistance and Immunity to Poison has no active effect form; the
 * effect adds the Vulnerability and states the rest. DDB's own modifier would give the
 * Vulnerability to whoever carries the vial, so the automatic effect is dropped.
 */
export default class VilesmogBomb extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Throw", {
      template: { type: "sphere", size: "15" },
      range: "30",
      duration: { value: "2", units: "round" },
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Vilesmog Exposure",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Vilesmog Exposure", {
        condition: "Enters the vapor or starts its turn there",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vilesmog",
        activityMatch: "Vilesmog Exposure",
        changes: [DDBEnricherData.ChangeHelper.damageVulnerabilityChange("poison")],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Loses any Resistance or Immunity to Poison damage and has Vulnerability to it for 1 minute.",
        },
      },
    ];
  }

}
