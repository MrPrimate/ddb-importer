import type DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";

/** Modifier effects have already been generated when an item's explicit effects are requested. */
export function hasItemEffectChange(enricher: DDBEnricherData, key: string): boolean {
  return ((enricher.ddbParser as DDBItem).data.effects ?? []).some((effect) =>
    effect.system?.changes?.some((change) => change.key === key),
  );
}
