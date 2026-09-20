import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

/** Spending the last charge prompts a separate roll without consuming another charge. */
export function lastChargeCheck(): IDDBAdditionalActivity {
  return itemActivity("Last Charge Check", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
    activationCondition: "After spending the last charge; on a 1, destroy the item manually",
    data: { roll: { formula: "1d20", prompt: false, visible: true, name: "Destruction Check" } },
  });
}
