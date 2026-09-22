import DDBEnricherData from "../../data/DDBEnricherData";
import { areaPlacerData, areaTrigger } from "../../data/AreaBuilders";

export default class SickeningVapors extends DDBEnricherData {
  override get type(): IDDBActivityType {
    return "utility";
  }

  override get activity(): IDDBActivityData {
    return areaPlacerData("Place Aura", {
      template: { type: "radius", size: "5" },
      activationType: "special",
      activationCondition: "At the end of the manes's turn, each other creature within 5 feet saves",
      duration: { units: "perm" },
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      areaTrigger("Sickening Vapors Save", {
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
        options: { transfer: false, expiry: "targetEnd", durationSeconds: 6, durationRounds: 1 },
      },
    ];
  }
}
