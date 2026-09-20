import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import utils from "../../../lib/Utils";

/** An item's unmodified source text, including property rules kept outside its description. */
export function itemText(enricher: DDBEnricherData): string {
  const source = (enricher.ddbParser as DDBItem).ddbDefinition;
  return [source.description, ...(source.properties ?? []).map((p) => p.description)]
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasItemSource(enricher: DDBEnricherData, ...ids: number[]): boolean {
  return ((enricher.ddbParser as DDBItem).ddbDefinition.sources ?? []).some(
    (source) => source.sourceType === 1 && ids.includes(source.sourceId),
  );
}

/** Secondary modes start without the weapon's damage, charge cost, area or applied effects. */
export function itemActivity(
  name: string,
  type: IDDBActivityType,
  overrides: IDDBActivityData = {},
  build: IDDBActivityBuild = {},
): IDDBAdditionalActivity {
  const defaults: Partial<I5eActivity> = { damage: { includeBase: false, parts: [] } };
  const data: Partial<I5eActivity> = ["attack", "save", "damage"].includes(type)
    ? foundry.utils.mergeObject(defaults, overrides.data ?? {}, { inplace: false }) as Partial<I5eActivity>
    : overrides.data;
  return {
    init: { name, type, id: utils.namedIDStub(name, { prefix: "ddbItem" }) },
    build: {
      generateActivation: true,
      generateTarget: true,
      generateRange: true,
      generateDamage: false,
      generateConsumption: false,
      includeBaseDamage: false,
      activationOverride: { type: "special", value: null, condition: "" },
      rangeOverride: { units: "self" },
      targetOverride: { affects: { type: "self", count: "", choice: false }, template: { type: "" } },
      ...build,
    },
    overrides: {
      noConsumeTargets: true,
      noSpellslot: true,
      noeffect: true,
      noTemplate: true,
      allowCritical: type === "attack",
      ...overrides,
      data,
    },
  };
}

/** Keep imported expenditure while making a source-defined resource available to all its modes. */
export function itemUses(
  enricher: DDBEnricherData,
  max: string,
  recovery: I5eSystemLimitedUses["recovery"] = [],
): IDDBOverrideData {
  const parser = enricher.ddbParser as DDBItem;
  const spent = foundry.utils.getProperty(parser.data, "system.uses.spent") as number | null | undefined;
  return {
    retainUseSpent: true,
    uses: { max, spent: spent ?? parser.ddbItem.chargesUsed ?? 0, recovery, autoDestroy: false },
  };
}
