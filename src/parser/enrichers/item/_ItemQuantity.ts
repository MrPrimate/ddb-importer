import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

/** A rolled starting quantity uses a fixed upper bound and records missing doses as expenditure. */
export function quantityUses(enricher: DDBEnricherData, maximum: number): IDDBOverrideData {
  const result = itemUses(enricher, String(maximum));
  result.uses!.spent = maximum;
  result.retainActivityUseSpent = true;
  return result;
}

export function determineQuantity(name: string, formula: string): IDDBAdditionalActivity {
  return itemActivity(name, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
    activationCondition: "Once, when first found; sets the available quantity. Keep the item to track remaining uses.",
    addItemConsume: true,
    itemConsumeValue: `@item.uses.max - @item.uses.spent - (${formula})`,
    addActivityConsume: true,
    data: { uses: { max: "1", spent: 0, recovery: [] } },
  });
}
