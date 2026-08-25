/**
 * Builders for activity `behaviors[]` entries (dnd5e 6.0). Behaviors become
 * RegionBehaviors on the Region a template or emanation creates when the
 * activity is used.
 * The system's own behavior types are preferred, matching the
 * dnd5e SRD content;
 * `macro` adds ddb-importer's `ddbMacro` behavior for the
 * per-token region automation core has no equivalent for (damage/save on
 * entry or per turn).
 */

interface IBehaviorLevel {
  min?: number | null;
  max?: number | null;
}

interface IBehaviorCommon {
  name?: string;
  /** Gate on `relevantLevel` (class level when the activity sets `visibility.identifier`, else character/spell level). */
  level?: IBehaviorLevel;
  /** Emit only when the Aura Effects module is active. */
  auraeffectsOnly?: boolean;
  /** Emit only when the Aura Effects module is NOT active (the native fallback for an aura the module would otherwise drive). */
  auraeffectsNever?: boolean;
  /** Emit only when Automated Conditions 5e is active. */
  ac5eOnly?: boolean;
  /** Emit only when Automated Conditions 5e is NOT active (the native fallback for an aura AC5e would otherwise drive). */
  ac5eNever?: boolean;
}

export default class BehaviorHelper {

  static #base({ name = "", level, auraeffectsOnly, auraeffectsNever, ac5eOnly, ac5eNever }: IBehaviorCommon) {
    return {
      _id: foundry.utils.randomID(),
      name,
      level: { min: level?.min ?? null, max: level?.max ?? null },
      ...(auraeffectsOnly || auraeffectsNever || ac5eOnly || ac5eNever
        ? { ddbimporter: { auraeffectsOnly, auraeffectsNever, ac5eOnly, ac5eNever } }
        : {}),
    };
  }

  /**
   * Apply effects to tokens inside the region. `effects` are the NAMES of
   * effects the enricher declared with `standalone: true` (resolved to the
   * effects compendium UUIDs at import) or full ActiveEffect UUIDs, normally
   * stock dnd5e ones via `SRDEffects` (e.g. `SRDEffects.condition("deafened")`).
   * Disposition filtering comes from the activity's target type (ally/enemy).
   */
  static applyEffect({ effects, sizes = [], types = [], ...common }: IBehaviorCommon & {
    effects: string | string[];
    sizes?: TActorSizes[];
    types?: TCreatureTypes[];
  }): I5eActivityBehavior {
    return {
      ...BehaviorHelper.#base(common),
      type: "applyActiveEffect",
      config: {
        effects: Array.isArray(effects) ? effects : [effects],
        sizes,
        types,
      },
    };
  }

  /** Difficult terrain inside the region; `types` are `CONFIG.DND5E.difficultTerrainTypes` keys, e.g. "plants", "web". */
  static difficultTerrain({ types = [], ...common }: IBehaviorCommon & { types?: string[] } = {}): I5eActivityBehavior {
    return {
      ...BehaviorHelper.#base(common),
      type: "difficultTerrain",
      config: { types },
    };
  }

  /**
   * ddb-importer region automation: run a registered handler (default
   * `useActivity`, which uses the placing item's activity against the
   * triggering token) on the given core region events.
   */
  static macro({ handler = "useActivity", events, args = {}, ...common }: IBehaviorCommon & {
    handler?: string;
    events: string[];
    args?: Record<string, unknown>;
  }): I5eActivityBehavior {
    const { activityId, oncePerTurn, scale, macroParameters, macroFunction, ...rest } = args as {
      activityId?: string;
      oncePerTurn?: boolean;
      scale?: boolean;
      macroParameters?: string;
      macroFunction?: string;
      [key: string]: unknown;
    };
    return {
      ...BehaviorHelper.#base(common),
      type: "ddbMacro",
      config: {
        function: handler,
        events,
        activity: activityId ?? "",
        macroName: macroFunction ?? "",
        oncePerTurn: oncePerTurn ?? true,
        scale: scale ?? true,
        macroParameters: macroParameters ?? "{}",
        args: rest,
      },
    };
  }

  /**
   * Use an activity against tokens that trigger the given region events
   * (damage/save on entry or per turn). Enrichers should use THIS rather than
   * `macro` for activity triggers: today it emits the ddbMacro useActivity
   * behavior, but if the 5e system grows an equivalent native behavior the
   * emission can be re-pointed here without touching any enricher.
   */
  static activity({ activityId, activityName, events, oncePerTurn, scale, macroParameters, ...common }: IBehaviorCommon & {
    /** Sibling activity id to use; omit both to use the placing activity itself. */
    activityId?: string;
    /** Sibling activity name, for additional activities whose ids are generated at parse. */
    activityName?: string;
    events: string[];
    oncePerTurn?: boolean;
    scale?: boolean;
    macroParameters?: string;
  }): I5eActivityBehavior {
    return BehaviorHelper.macro({
      ...common,
      handler: "useActivity",
      events,
      args: {
        ...(activityId !== undefined ? { activityId } : {}),
        ...(activityName !== undefined ? { activityName } : {}),
        ...(oncePerTurn !== undefined ? { oncePerTurn } : {}),
        ...(scale !== undefined ? { scale } : {}),
        ...(macroParameters !== undefined ? { macroParameters } : {}),
      },
    });
  }

}
