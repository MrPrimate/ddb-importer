import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../../data/RegionBuilders";

export default class SickeningVapors extends DDBEnricherData {
  override get type(): IDDBActivityType {
    return "utility";
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Place Aura", {
      template: { type: "radius", size: "5" },
      activationType: "special",
      duration: { units: "perm" },
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          ownerTurn: true,
          events: ["tokenTurnEnd"],
          activityName: "Sickening Vapors Save",
          excludeSelf: true,
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Sickening Vapors Save", {
        condition: "End of the manes's turn. Track 24-hour immunity to this manes after a successful save manually.",
        save: { ability: ["con"], dc: "12" },
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Sickening Vapors",
        activityMatch: "Sickening Vapors Save",
        statuses: ["Incapacitated"],
        options: { transfer: false, durationSeconds: null, expiry: "turnEnd" },
      },
    ];
  }
}
