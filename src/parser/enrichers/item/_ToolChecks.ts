import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import { itemActivity, itemText } from "./_ItemActivities";

export function hasToolUses(enricher: DDBEnricherData): boolean {
  return !enricher.is2014 && (/Utilize:/i).test(itemText(enricher));
}

/** Specific tool keys let native checks use both proficiency and item-level expertise. */
export function toolCheck(enricher: DDBEnricherData, name: string, ability: string, dc: number): IDDBActivityData {
  const parser = enricher.ddbParser as DDBItem;
  const baseItem = foundry.utils.getProperty(parser.data, "system.type.baseItem") as string | undefined;
  return {
    name,
    activationType: "action",
    noConsumeTargets: true,
    noTemplate: true,
    rangeSelf: true,
    targetType: "self",
    data: { check: { ability, associated: baseItem ? [baseItem] : [], dc: { calculation: "", formula: String(dc) } } },
  };
}

export function extraToolCheck(
  enricher: DDBEnricherData,
  name: string,
  ability: string,
  dc: number,
): IDDBAdditionalActivity {
  return itemActivity(name, DDBEnricherData.ACTIVITY_TYPES.CHECK, toolCheck(enricher, name, ability, dc));
}
