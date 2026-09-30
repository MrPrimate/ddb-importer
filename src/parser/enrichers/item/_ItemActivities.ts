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

/**
 * The spells DDB attached to this item on a character import. The item-spell path already builds
 * their cast activities, so an enricher adding its own cast skips these. Empty for the muncher.
 */
export function shippedItemSpellNames(enricher: DDBEnricherData): string[] {
  const definitionId = enricher.ddbParser?.ddbDefinition?.id;
  // only the item parser carries the character's item spells; the parser union has no `raw`
  const parser = enricher.ddbParser as { raw?: { itemSpells?: I5eSpellItem[] } } | undefined;
  const itemSpells = parser?.raw?.itemSpells ?? [];
  return itemSpells
    .filter((spell) => spell.flags?.ddbimporter?.dndbeyond?.lookup === "item"
      && spell.flags?.ddbimporter?.dndbeyond?.lookupId === definitionId)
    .map((spell) => spell.flags?.ddbimporter?.originalName ?? spell.name);
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

interface IItemPropertyOptions {
  save?: { ability: string[]; formula?: string; calculation?: string };
  damageParts?: I5eDamagePart[];
  onSave?: "half" | "none" | "full";
  activationType?: TActivationCost;
  condition?: string;
  /** a template, or "creature" for one creature */
  template?: I5eActivityTarget["template"] | "creature";
  /** creatures targeted without a template, "1" by default */
  targetCount?: string;
  /** the wielder is the one affected (a save the property forces on its own bearer) */
  selfTarget?: boolean;
  /** spend more charges than `charges` by consumption scaling, up to this many scaling steps */
  scalingMax?: string;
  range?: { value: string | null; units: TDistanceUnit };
  /** item charges spent per use */
  charges?: string;
  /** the activity's own limited uses: max per recovery period */
  uses?: { max: string; period: string };
  noeffect?: boolean;
  data?: Partial<I5eActivity>;
}

/**
 * A weapon's activated or triggered property as its own save or damage activity: a trigger
 * condition, one creature or an area, an optional charge cost or once-per-period use, and no base
 * weapon damage.
 */
export function itemProperty(
  name: string,
  type: IDDBActivityType,
  options: IItemPropertyOptions,
): IDDBAdditionalActivity {
  const target = options.selfTarget
    ? { override: true, affects: { count: "", type: "self" }, template: {} }
    : options.template === "creature" || !options.template
      ? { override: true, affects: { count: options.targetCount ?? "1", type: "creature" }, template: {} }
      : { override: true, affects: { count: "", type: "creature" }, template: { units: "ft", ...options.template } };
  const data: Partial<I5eActivity> = foundry.utils.mergeObject({
    damage: { onSave: options.onSave ?? "none", includeBase: false, parts: options.damageParts ?? [] },
  }, options.data ?? {}, { inplace: false });
  if (options.uses) {
    foundry.utils.setProperty(data, "uses", {
      spent: 0,
      max: options.uses.max,
      recovery: [{ period: options.uses.period, type: "recoverAll" }],
    });
  }
  return {
    init: { name, type, id: utils.namedIDStub(name, { prefix: "ddbItem" }) },
    build: {
      generateActivation: true,
      generateTarget: true,
      generateRange: true,
      generateConsumption: false,
      generateSave: Boolean(options.save),
      generateDamage: (options.damageParts?.length ?? 0) > 0,
      includeBaseDamage: false,
      damageParts: options.damageParts ?? [],
      saveOverride: options.save
        ? { ability: options.save.ability, dc: { calculation: options.save.calculation ?? "", formula: options.save.formula ?? "" } }
        : undefined,
      activationOverride: {
        type: options.activationType ?? "special",
        value: (options.activationType ?? "special") === "special" ? null : 1,
        condition: options.condition ?? "",
      },
      targetOverride: target as IDDBActivityBuild["targetOverride"],
      rangeOverride: options.selfTarget
        ? { override: true, value: null, units: "self", special: "" }
        : { override: true, value: options.range ? options.range.value : "5", units: options.range?.units ?? "ft", special: "" },
    },
    overrides: {
      noConsumeTargets: !options.charges && !options.uses,
      addItemConsume: Boolean(options.charges),
      itemConsumeValue: options.charges,
      addActivityConsume: Boolean(options.uses),
      ...(options.scalingMax
        ? { addScalingMode: "amount", addScalingFormula: "1", addConsumptionScalingMax: options.scalingMax }
        : {}),
      noeffect: options.noeffect ?? false,
      data,
    },
  };
}

/** An ability check a property calls for: "a DC 15 Strength (Athletics) check to free it". */
export function itemCheck(
  name: string,
  { ability, skill, dc, activationType = "action", condition = "" }: {
    ability: string; skill?: string; dc: string; activationType?: TActivationCost; condition?: string;
  },
): IDDBAdditionalActivity {
  return {
    init: { name, type: DDBEnricherData.ACTIVITY_TYPES.CHECK, id: utils.namedIDStub(name, { prefix: "ddbItem" }) },
    build: {
      generateCheck: true,
      generateActivation: true,
      generateConsumption: false,
      generateTarget: true,
      checkOverride: { ability, associated: skill ? [skill] : [], dc: { calculation: "", formula: dc } },
      activationOverride: { type: activationType, value: activationType === "special" ? null : 1, condition },
      targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
    },
    overrides: {
      noConsumeTargets: true,
      noTemplate: true,
      noeffect: true,
    },
  };
}

/** The first "DC N" in a stretch of item text, or the fallback. */
export function textDC(text: string, pattern: RegExp, fallback: string): string {
  return pattern.exec(text)?.[1] ?? fallback;
}

/**
 * Retributive Strike (Staff of Power, Staff of the Magi): break the staff in a 30 foot sphere
 * around it for force damage scaled by its remaining charges, a Dexterity save for half. The 2014
 * printing scales by distance band (the nearest band's multiplier is used, the others are in the
 * condition), the 2024 one by a flat multiplier; the wielder takes the self multiplier unless they
 * escape to another plane.
 */
export function retributiveStrike(text: string): IDDBAdditionalActivity {
  const strike = text.slice(Math.max(0, text.lastIndexOf("Retributive Strike.")));
  const multiplier = String.raw`(\d+)\s*(?:x|×|times)\s*the number of charges`;
  const failed = strike.slice(Math.max(0, strike.search(/On a failed save/i)));
  const bands = [...failed.matchAll(new RegExp(multiplier, "gi"))].map((match) => match[1]);
  const self = new RegExp(`equal to ${multiplier}`, "i").exec(strike)?.[1] ?? "16";
  const nearest = bands[0] ?? "4";
  const bandText = bands.length > 1
    ? `${bands[0]}x charges within 10 ft, ${bands[1]}x at 11-20 ft, ${bands[2] ?? bands[1]}x at 21-30 ft`
    : `${nearest}x charges`;
  return itemProperty("Retributive Strike", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
    save: { ability: ["dex"], formula: textDC(strike, /DC (\d+) Dexterity/i, "17") },
    damageParts: [DDBEnricherData.basicDamagePart({ customFormula: `${nearest} * @item.uses.value`, types: ["force"] })],
    onSave: "half",
    activationType: "action",
    condition: `Break the staff; it is destroyed. Other creatures in 30 ft: ${bandText}. You take ${self}x charges unless you escape to another plane (50%)`,
    template: { type: "radius", size: "30" },
    range: { value: null, units: "self" },
    noeffect: true,
  });
}

/**
 * Sets the uses of the cast activities the item parse built for its spells (named "Spell (Item)"):
 * a listed spell is cast once per `period` from the activity's own use, and `unlimited` spells
 * (a cantrip) spend nothing. Run from an enricher's `cleanup`, after the casts exist.
 */
export function setItemCastUses(
  data: { system?: { activities?: Record<string, I5eActivity> } },
  { limited = [], unlimited = [], period = "dawn" }: { limited?: string[]; unlimited?: string[]; period?: TLimitedUsePeriod },
): void {
  const spellName = (activity: I5eActivity) => (activity.name ?? "").replace(/\s*\(.*\)\s*$/, "");
  for (const activity of Object.values(data.system?.activities ?? {})) {
    if (activity.type !== "cast") continue;
    const name = spellName(activity);
    if (unlimited.includes(name)) {
      activity.uses = { spent: 0, max: "", recovery: [] };
      foundry.utils.setProperty(activity, "consumption.targets", []);
    } else if (limited.includes(name)) {
      activity.uses = { spent: 0, max: "1", recovery: [{ period, type: "recoverAll" }] };
      foundry.utils.setProperty(activity, "consumption.targets", [
        { type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
      ]);
    }
  }
}
