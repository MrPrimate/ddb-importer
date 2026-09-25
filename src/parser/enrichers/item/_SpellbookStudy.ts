import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

/** Study and the special property spend from the same three-charge spellbook pool. */
export function spellbookStudy(school: string): IDDBAdditionalActivity {
  return itemActivity("Study", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
    activationType: "minute",
    activationValue: 1,
    addItemConsume: true,
    activationCondition: `Replace a prepared wizard spell with a ${school} spell in this book; select the spell manually`,
    targetType: "self",
  });
}
