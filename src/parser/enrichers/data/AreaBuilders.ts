import DDBEnricherData from "./DDBEnricherData";

/**
 * Builders for any document that places an area on the map, whatever kind of enricher it belongs
 * to: a "placer" that carries the template, plus the special-activation "trigger" activities used
 * by hand against a creature the area acts on later. dnd5e 5.x has no region behaviours, so the
 * placer draws the area and nothing more; what the area does, and to whom, is written into the
 * trigger's activation condition for the table to read.
 *
 * These mirror main's RegionBuilders call for call (regionPlacer -> areaPlacer, regionTrigger ->
 * areaTrigger) minus the behaviors, so a backport only has to rename the import and drop the
 * `behaviors` arrays. Spells add their own slot handling on top of these in spell/_SpellAreas.
 */

interface IAreaTemplate {
  type: TTemplate;
  size: string;
  width?: string;
  height?: string;
  count?: string;
}

interface IAreaRoll {
  /** `dc` is a flat DC unless `calculation` names an ability or "spellcasting". */
  save?: { ability: string[]; dc?: string; calculation?: string };
  damageParts?: I5eDamagePart[];
  onSave?: "none" | "half" | "full";
}

interface IAreaPlacer extends IAreaRoll {
  template: IAreaTemplate;
  /** "creature", "ally" or "enemy": who the area is for. */
  affects?: TTarget;
  /** Range to the point of origin in feet; omit for an area that originates from the owner. */
  range?: string;
  /** A point of origin the rules describe in words (a space just walked through, an ammunition hit). */
  rangeSpecial?: string;
  activationType?: TActivationCost;
  activationCondition?: string;
  duration?: I5eActivityDuration;
  /** Spend the item's own uses (charges, or the consumable itself). */
  consume?: boolean;
  consumeValue?: string | number;
  /** Let extra charges be spent on one use; the template size can then read `@scaling`. */
  consumeScalingMax?: string;
  /** Uses of the placer's own, for a property with a daily limit separate from the item's charges. */
  uses?: I5eSystemLimitedUses;
  /** Leave the placer open to effect links, for a marker effect the owner gains with the area. */
  linkEffects?: boolean;
}

interface IAreaTrigger extends IAreaRoll {
  /** "creature", "ally" or "enemy", relative to whoever placed the area. */
  affects?: TTarget;
  condition: string;
  /** A table or duration roll for a trigger that neither saves nor deals damage. */
  roll?: I5eActivityRoll;
}

function rollType({ save, damageParts }: IAreaRoll): IDDBActivityType {
  if (save) return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  return (damageParts ?? []).length > 0
    ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE
    : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
}

function rollSave({ save }: IAreaRoll): I5eActivitySave | null {
  if (!save) return null;
  return { ability: save.ability, dc: { calculation: save.calculation ?? "", formula: save.dc ?? "" } };
}

function rollBuild(roll: IAreaRoll): IDDBActivityBuild {
  const save = rollSave(roll);
  const hasDamage = (roll.damageParts ?? []).length > 0;
  return {
    generateSave: Boolean(save),
    generateDamage: hasDamage,
    ...(save ? { saveOverride: save } : {}),
    ...(hasDamage ? { damageParts: roll.damageParts } : {}),
  };
}

/**
 * An activity target that places the given area. Overriding the target also stops it inheriting
 * who is affected from the document, so that is always restated.
 */
export function areaTarget(template: IAreaTemplate, affects: TTarget = "creature"): I5eActivityTarget {
  return {
    override: true,
    affects: { type: affects },
    template: {
      contiguous: false,
      units: "ft",
      ...template,
    },
  };
}

/**
 * An area centred on its owner that moves with them. DDB often records these as a sphere, which
 * dnd5e places as a fixed circle; only a "radius" template is drawn from the token.
 */
export function emanation(size: string, affects: TTarget = "creature"): I5eActivityTarget {
  return areaTarget({ type: "radius", size, count: "1" }, affects);
}

/** A fixed area, for a document DDB gives no template or the wrong one. */
export function area(
  type: TTemplate, size: string, extra: Partial<IAreaTemplate> = {}, affects: TTarget = "creature",
): I5eActivityTarget {
  return areaTarget({ type, size, count: "1", ...extra }, affects);
}

function placerTarget({ template, affects }: IAreaPlacer): I5eActivityTarget {
  return areaTarget(template, affects);
}

function placerRange({ range, rangeSpecial }: IAreaPlacer): I5eActivityRange {
  if (range) return { override: true, value: range, units: "ft" };
  if (rangeSpecial) return { override: true, value: null, units: "spec", special: rangeSpecial };
  return { override: true, value: null, units: "self", special: "" };
}

function placerConsumption(placer: IAreaPlacer): Partial<IDDBActivityData> {
  if (placer.consume) {
    return {
      addItemConsume: true,
      ...(placer.consumeValue ? { itemConsumeValue: placer.consumeValue } : {}),
      ...(placer.consumeScalingMax
        ? { addScalingMode: "amount", addConsumptionScalingMax: placer.consumeScalingMax }
        : {}),
    };
  }
  return placer.uses ? {} : { noConsumeTargets: true };
}

// spreading this beside other keys widens the literal past the activity union, so callers cast the result
function placerUses({ uses }: IAreaPlacer): Partial<I5eActivity> {
  if (!uses) return {};
  return {
    uses,
    consumption: {
      targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
      scaling: { allowed: false, max: "" },
    },
  };
}

/** The placer as an item's primary activity, for an item that does nothing else when used. */
export function areaPlacerData(name: string, placer: IAreaPlacer): IDDBActivityData {
  return {
    name,
    targetType: placer.affects ?? "creature",
    activationType: placer.activationType ?? "action",
    ...(placer.activationCondition ? { activationCondition: placer.activationCondition } : {}),
    ...placerConsumption(placer),
    ...(placer.linkEffects ? {} : { noeffect: true }),
    removeDamageParts: true,
    ...((placer.damageParts ?? []).length > 0 ? { damageParts: placer.damageParts } : {}),
    data: {
      ...(placer.save ? { save: rollSave(placer) ?? {}, damage: { onSave: placer.onSave ?? "none" } } : {}),
      target: placerTarget(placer),
      range: placerRange(placer),
      ...(placer.duration ? { duration: { override: true, ...placer.duration } } : {}),
      ...placerUses(placer),
    } as Partial<I5eActivity>,
  };
}

/**
 * The placer as an extra activity, for an item whose area is one property among several. With a
 * save or damage it also rolls when placed, for an area the rules resolve as it appears.
 */
export function areaPlacer(name: string, placer: IAreaPlacer): IDDBAdditionalActivity {
  return {
    init: { name, type: rollType(placer) },
    build: {
      ...rollBuild(placer),
      generateActivation: true,
      generateTarget: true,
      generateRange: true,
      generateDuration: Boolean(placer.duration),
      generateConsumption: false,
      activationOverride: {
        type: placer.activationType ?? "action",
        value: null,
        condition: placer.activationCondition ?? "",
      },
      targetOverride: placerTarget(placer),
      rangeOverride: placerRange(placer),
      ...(placer.duration ? { durationOverride: { override: true, ...placer.duration } } : {}),
    },
    overrides: {
      ...placerConsumption(placer),
      ...(placer.linkEffects ? {} : { noeffect: true }),
      data: {
        ...(placer.save ? { damage: { onSave: placer.onSave ?? "none" } } : {}),
        ...placerUses(placer),
      } as Partial<I5eActivity>,
    },
  };
}

/**
 * What the area does to one creature later on, used by hand. It spends nothing and places
 * nothing: the area already exists, so the range is self and the template is blank. The
 * instantaneous duration keeps a spell's concentration from restarting when it is used.
 */
export function areaTrigger(name: string, trigger: IAreaTrigger): IDDBAdditionalActivity {
  return {
    init: { name, type: rollType(trigger) },
    build: {
      ...rollBuild(trigger),
      generateActivation: true,
      generateConsumption: false,
      generateTarget: true,
      generateRange: true,
      generateDuration: true,
      durationOverride: { override: true, value: "", units: "inst", concentration: false },
      activationOverride: { type: "special", value: null, condition: trigger.condition },
      targetOverride: {
        override: true,
        affects: { count: "1", type: trigger.affects ?? "creature" },
        template: {},
      },
      rangeOverride: { override: true, value: null, units: "self", special: "" },
    },
    overrides: {
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        ...(trigger.save ? { damage: { onSave: trigger.onSave ?? "none" } } : {}),
        ...(trigger.roll ? { roll: trigger.roll } : {}),
      },
    },
  };
}
