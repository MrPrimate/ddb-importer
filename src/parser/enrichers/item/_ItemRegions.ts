import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Builders for items that place a Region: a utility "placer" that carries the template and the
 * region behaviors and rolls nothing, plus the special-activation "trigger" activities a region
 * fires against the token that entered or started its turn inside. Dispositions are derived from
 * an activity's `affects` type when the region is placed, and a behavior that fires a trigger takes
 * the TRIGGER's dispositions, so "enemies only" belongs on the trigger.
 */

interface IRegionTemplate {
  type: TTemplate;
  size: string;
  width?: string;
  height?: string;
  count?: string;
  /** A "radius" template is an emanation that follows the owner's token unless it is stationary. */
  stationary?: boolean;
}

interface IRegionRoll {
  /** `dc` is a flat DC unless `calculation` names an ability or "spellcasting". */
  save?: { ability: string[]; dc?: string; calculation?: string };
  damageParts?: I5eDamagePart[];
  onSave?: "none" | "half" | "full";
}

interface IRegionPlacer extends IRegionRoll {
  template: IRegionTemplate;
  /** "creature", "ally" or "enemy": who the native behaviors (effects, terrain) apply to. */
  affects?: TTarget;
  /** Range to the point of origin in feet; omit for an area that originates from the owner. */
  range?: string;
  /** A point of origin the rules describe in words (a space just walked through, an ammunition hit). */
  rangeSpecial?: string;
  behaviors: I5eActivityBehavior[];
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

interface IRegionTrigger extends IRegionRoll {
  /** "creature", "ally" or "enemy", relative to whoever placed the region. */
  affects?: TTarget;
  condition: string;
  /** A table or duration roll for a trigger that neither saves nor deals damage. */
  roll?: I5eActivityRoll;
}

function rollType({ save, damageParts }: IRegionRoll): IDDBActivityType {
  if (save) return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  return (damageParts ?? []).length > 0
    ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE
    : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
}

function rollSave({ save }: IRegionRoll): I5eActivitySave | null {
  if (!save) return null;
  return { ability: save.ability, dc: { calculation: save.calculation ?? "", formula: save.dc ?? "" } };
}

function rollBuild(roll: IRegionRoll): IDDBActivityBuild {
  const save = rollSave(roll);
  const hasDamage = (roll.damageParts ?? []).length > 0;
  return {
    generateSave: Boolean(save),
    generateDamage: hasDamage,
    ...(save ? { saveOverride: save } : {}),
    ...(hasDamage ? { damageParts: roll.damageParts } : {}),
  };
}

function placerTarget({ template, affects = "creature" }: IRegionPlacer): I5eActivityTarget {
  const { stationary, ...shape } = template;
  return {
    override: true,
    affects: { type: affects },
    template: {
      contiguous: false,
      units: "ft",
      ...shape,
      ...(stationary ? { stationary: true } : {}),
    },
  };
}

function placerRange({ range, rangeSpecial }: IRegionPlacer): I5eActivityRange {
  if (range) return { override: true, value: range, units: "ft" };
  if (rangeSpecial) return { override: true, value: null, units: "spec", special: rangeSpecial };
  return { override: true, value: null, units: "self", special: "" };
}

function placerConsumption(placer: IRegionPlacer): Partial<IDDBActivityData> {
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

function placerUses({ uses }: IRegionPlacer): Partial<I5eActivity> {
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
export function regionPlacerData(name: string, placer: IRegionPlacer): IDDBActivityData {
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
      behaviors: placer.behaviors,
    },
  };
}

/**
 * The placer as an extra activity, for an item whose area is one property among several. With a
 * save or damage it also rolls when placed, for an area the rules resolve as it appears.
 */
export function regionPlacer(name: string, placer: IRegionPlacer): IDDBAdditionalActivity {
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
        behaviors: placer.behaviors,
      },
    },
  };
}

/**
 * What a region fires against one token. It spends nothing and places nothing: the area already
 * exists, so the range is self and the template is blank.
 */
export function regionTrigger(name: string, trigger: IRegionTrigger): IDDBAdditionalActivity {
  return {
    init: { name, type: rollType(trigger) },
    build: {
      ...rollBuild(trigger),
      generateActivation: true,
      generateConsumption: false,
      generateTarget: true,
      generateRange: true,
      // an instantaneous trigger keeps dnd5e from stamping the item's own duration onto the
      // effects it applies, which carry their own expiry or none at all
      generateDuration: true,
      durationOverride: { override: true, value: "", units: "inst" },
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

/**
 * The Athletics or Acrobatics check that ends a grapple. The parser writes this one itself, but
 * only for an item whose enricher adds no activities of its own.
 */
export function escapeCheck(dc: string, name = "Escape Check"): IDDBAdditionalActivity {
  return {
    init: { name, type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
    build: {
      generateTarget: false,
      generateRange: false,
      generateConsumption: false,
      generateCheck: true,
      checkOverride: { ability: "", associated: ["acr", "ath"], dc: { calculation: "", formula: dc } },
    },
    overrides: { noConsumeTargets: true, noTemplate: true, noeffect: true },
  };
}
