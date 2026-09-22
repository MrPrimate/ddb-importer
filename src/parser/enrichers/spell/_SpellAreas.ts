import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Builders for spells whose area keeps rolling after the cast. Two shapes, chosen by whether the
 * rules roll anything as the spell is cast:
 *
 * - They do: the parsed save stays the cast, and `ongoingClone` duplicates it as the free
 *   "Ongoing Save" used by hand against a creature the area acts on later.
 * - They do not: `castPlacer` turns the cast into a slot-spending utility that only places the
 *   area, and `ongoingTrigger` builds the roll as a free sibling. Its save, damage and upcast
 *   scaling are left to the spell parser, which reads them from DDB, so nothing is restated here.
 *   `ongoingAttack` is the same sibling for a spell that attacks instead, and `movementDamage`
 *   the one for damage per 5 feet moved.
 *
 * Every follow-up is instantaneous and non-concentrating: on dnd5e 5.x an activity that inherits
 * the spell's concentration duration restarts concentration when used and drops the original
 * template and effects. These mirror main's _SpellRegions minus the region behaviors.
 */

// the target builders are shared with every other enricher kind; spell enrichers take them from here
export { area, emanation } from "../data/AreaBuilders";

interface IOngoingTrigger {
  name?: string;
  condition: string;
  /** "creature", "ally" or "enemy", relative to the caster. */
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

/** The cast as a utility that only places the area. */
export function castPlacer(data: Partial<IActivityData> = {}): IDDBActivityData {
  return {
    name: "Cast",
    removeDamageParts: true,
    // what the area does to a creature belongs to the roll used later, not to the cast
    noeffect: true,
    data,
  };
}

/** The free roll used against one token, for a spell that rolls nothing when cast. */
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
      // Follow-up rolls must not inherit the spell's concentration and replace its dependents.
      generateDuration: true,
      durationOverride: { units: "inst", concentration: false },
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

/** The cast-time save again, free and without a template, to use by hand. */
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
        duration: { override: true, units: "inst", concentration: false },
        range: { override: true, units: "spec" },
        target: { override: true },
      },
    },
  };
}

interface IOngoingAttack {
  name: string;
  condition: string;
  affects?: TTarget;
  /** "reaction" where the rules spend one. */
  activation?: TActivationCost;
}

/** The free attack used against one token; the dice and upcast scaling are DDB's. */
export function ongoingAttack({ name, condition, affects = "enemy", activation = "special" }: IOngoingAttack): IDDBAdditionalActivity {
  return {
    init: { name, type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
    build: {
      generateActivation: true,
      generateConsumption: false,
      generateDuration: true,
      durationOverride: { units: "inst", concentration: false },
      generateTarget: true,
      generateAttack: true,
      generateDamage: true,
      noSpellslot: true,
      activationOverride: { type: activation, value: activation === "special" ? null : 1, condition },
      targetOverride: { override: true, affects: { count: "1", type: affects }, template: {} },
    },
    overrides: {
      noTemplate: true,
      data: { range: { override: true, units: "spec" } },
    },
  };
}

export const MOVEMENT_DAMAGE = "Movement Damage";

/**
 * Damage "for every 5 feet it travels", rolled once per 5 feet by hand; `damageParts` picks the
 * DDB part when the spell has several.
 */
export function movementDamage(dice: string, damageParts?: number[]): IDDBAdditionalActivity {
  return ongoingTrigger({
    name: MOVEMENT_DAMAGE,
    condition: `Moves into or within the area (${dice} for every 5 feet moved)`,
    noSave: true,
    damageParts,
  });
}
