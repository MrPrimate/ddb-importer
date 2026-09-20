import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Builders for spells whose area keeps rolling after the cast. Two shapes, chosen by whether the
 * rules roll anything as the spell is cast:
 *
 * - They do: the parsed save stays the cast, and `ongoingClone` duplicates it as the free
 *   "Ongoing Save" the region fires. The clone must place no region of its own.
 * - They do not: `castPlacer` turns the cast into a slot-spending utility that only places the
 *   area, and `ongoingTrigger` builds the roll as a free sibling. Its save, damage and upcast
 *   scaling are left to the spell parser, which reads them from DDB, so nothing is restated here.
 */

interface IOngoingTrigger {
  name?: string;
  condition: string;
  /** "creature", "ally" or "enemy", relative to the caster; the region takes these dispositions. */
  affects?: TTarget;
  /** A roll with no save ("takes 2d8 radiant damage"). */
  noSave?: boolean;
  /** A save with no damage, when the spell's damage belongs to another moment. */
  noDamage?: boolean;
  /** Which of the spell's DDB damage parts this roll uses, by index, when the spell has several. */
  damageParts?: number[];
  /** The save ability, when it is not the one DDB records for the spell. */
  saveAbility?: string;
}

export const ONGOING = "Ongoing Save";

/** The cast as a utility that places the area and carries its behaviors. */
export function castPlacer(behaviors: I5eActivityBehavior[], data: Partial<I5eActivity> = {}): IDDBActivityData {
  return {
    name: "Cast",
    removeDamageParts: true,
    // what the area does to a creature belongs to the roll the region fires, not to the cast
    noeffect: true,
    data: { ...data, behaviors },
  };
}

/**
 * An area centred on the caster that moves with them. DDB often records these as a sphere, which
 * dnd5e places as a fixed circle; only a "radius" template becomes an emanation attached to the
 * token. Overriding the target also stops it inheriting who is affected, so that is restated.
 */
export function emanation(size: string, affects: TTarget = "creature"): I5eActivityTarget {
  return {
    override: true,
    affects: { type: affects },
    template: { count: "1", contiguous: false, type: "radius", size, units: "ft" },
  };
}

/** A fixed area, for a spell DDB gives no template or the wrong one. */
export function area(type: TTemplate, size: string, extra: Partial<I5eActivityTarget["template"]> = {}, affects: TTarget = "creature"): I5eActivityTarget {
  return {
    override: true,
    affects: { type: affects },
    template: { count: "1", contiguous: false, type, size, units: "ft", ...extra },
  };
}

/** The free roll a region fires against one token, for a spell that rolls nothing when cast. */
export function ongoingTrigger({
  name = ONGOING, condition, affects = "creature", noSave = false, noDamage = false, damageParts, saveAbility,
}: IOngoingTrigger): IDDBAdditionalActivity {
  const type = noSave
    ? (noDamage ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.DAMAGE)
    : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  return {
    init: { name, type },
    build: {
      generateActivation: true,
      generateConsumption: false,
      generateTarget: true,
      generateSave: !noSave,
      generateDamage: !noDamage,
      ...(damageParts ? { partialDamageParts: damageParts } : {}),
      ...(saveAbility
        ? { saveOverride: { ability: [saveAbility], dc: { calculation: "spellcasting", formula: "" } } }
        : {}),
      noSpellslot: true,
      activationOverride: { type: "special", value: null, condition },
      targetOverride: { override: true, affects: { count: "1", type: affects }, template: {} },
    },
    overrides: {
      data: { range: { override: true, units: "spec" } },
    },
  };
}

/** The cast-time save again, free and without a template, for the region to fire. */
export function ongoingClone(id: string, condition: string, name = ONGOING): IDDBAdditionalActivity {
  return {
    duplicate: true,
    id,
    overrides: {
      name,
      activationType: "special",
      activationCondition: condition,
      removeSpellSlotConsume: true,
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        range: { override: true, units: "spec" },
        target: { override: true },
        behaviors: [],
      },
    },
  };
}
