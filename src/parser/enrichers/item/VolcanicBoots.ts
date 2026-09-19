import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";
import { regionPlacerData, regionTrigger } from "./_ItemRegions";

/**
 * Each charge scorches one 5-foot cube the wearer just walked through, so one use places one cube
 * and spends one charge. The cube's region fires the save against any creature but the wearer
 * that enters it or starts its turn there. DDB carries no charges for the boots.
 */
export default class VolcanicBoots extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Scorch the Ground", {
      template: { type: "cube", size: "5" },
      rangeSpecial: "An unoccupied space you just walked through",
      activationType: "special",
      activationCondition: "Walk at least 5 feet on solid ground; one cube per charge",
      duration: { value: "1", units: "minute" },
      consume: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Volcanic Ground Save",
          excludeSelf: true,
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Volcanic Ground Save", {
        condition: "A creature other than the wearer enters a scorched cube or starts its turn there",
        save: { ability: ["dex"], dc: "15" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["fire"] }),
        ],
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "10", [{ period: "dawn", type: "formula", formula: "1d6 + 4" }]);
  }

}
