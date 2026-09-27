import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacerData, regionTrigger } from "../../data/RegionBuilders";

const CHECK = "Foundation Check";

/**
 * The builder pours a 20-foot square of wet concrete that stays difficult terrain for an hour.
 * A creature with Strength 20 or less that starts its turn there makes a DC 19 Strength
 * (Athletics) check or is Restrained until the start of its next turn. The generic placed-zone
 * reader only builds saves, so this stat block places the area itself and the region fires the
 * check. The Strength score limit is left to the table: region triggers cannot filter on it.
 */
export default class LayTheFoundation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Lay the Foundation", {
      template: { type: "square", size: "20", count: "1" },
      range: "5",
      duration: { value: "1", units: "hour" },
      // the recharge the parser linked to the item's uses stays
      consume: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.difficultTerrain(),
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenTurnStart"],
          activityName: CHECK,
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const trigger = regionTrigger(CHECK, {
      condition: "A creature with a Strength score of 20 or less starts its turn in the wet concrete",
    });
    return [{
      ...trigger,
      init: { name: CHECK, type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
      build: {
        ...trigger.build,
        generateCheck: true,
        checkOverride: { ability: "str", associated: ["ath"], dc: { calculation: "", formula: "19" } },
      },
    }];
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Lay the Foundation: Restrained",
      activityMatch: CHECK,
      statuses: ["Restrained"],
      options: {
        transfer: false,
        expiry: "turnStart",
        description: "Restrained by wet concrete until the start of its next turn.",
      },
    }];
  }

  // the parser's Restrained effect sat on the placing action; the check carries its own
  override get clearAutoEffects(): boolean {
    return true;
  }

}
