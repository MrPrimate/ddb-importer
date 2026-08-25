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

import utils from "../../../lib/Utils";
import SRDEffects from "./SRDEffects";

interface IBehaviorLevel {
  min?: number | null;
  max?: number | null;
}

interface IBehaviorCommon {
  /**
   * Name for the behavior entry, which becomes the name of the RegionBehavior the
   * activity places. Omit to take the builder's derived default (the applied
   * effects, the terrain types, or the triggered activity's name).
   */
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

  /**
   * A behavior naming an effect by compendium uuid gets the stock effect's name;
   * standalone effects are already referenced by name.
   */
  static #effectLabel(effect: string): string | null {
    if (!effect) return null;
    return SRDEffects.name(effect) ?? (effect.includes(".") ? null : effect);
  }

  static #base(
    { name, level, auraeffectsOnly, auraeffectsNever, ac5eOnly, ac5eNever }: IBehaviorCommon,
    defaultName = "",
  ) {
    return {
      _id: foundry.utils.randomID(),
      name: name || defaultName,
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
    const effectList = Array.isArray(effects) ? effects : [effects];
    const labels = effectList.map((effect) => BehaviorHelper.#effectLabel(effect)).filter((label) => label !== null);
    return {
      ...BehaviorHelper.#base(common, labels.length > 0 ? `Apply ${labels.join(", ")}` : "Apply Effect"),
      type: "applyActiveEffect",
      config: {
        effects: effectList,
        sizes,
        types,
      },
    };
  }

  /** Difficult terrain inside the region; `types` are `CONFIG.DND5E.difficultTerrainTypes` keys, e.g. "plants", "web". */
  static difficultTerrain({ types = [], ...common }: IBehaviorCommon & { types?: string[] } = {}): I5eActivityBehavior {
    const labels = types.map((type) => utils.capitalize(type));
    return {
      ...BehaviorHelper.#base(common, `Difficult Terrain${labels.length > 0 ? ` (${labels.join(", ")})` : ""}`),
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
      // useActivity behaviors that name no activity are named after the activity
      // they trigger by DDBActivityFactoryMixin._activityBehaviorNaming, once all
      // the sibling activities the id could point at exist.
      ...BehaviorHelper.#base(common, macroFunction ? `Macro: ${macroFunction}` : ""),
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
  static activity({ activityId, activityName, events, oncePerTurn, scale, autoRoll, macroParameters, ...common }: IBehaviorCommon & {
    /** Sibling activity id to use; omit both to use the placing activity itself. */
    activityId?: string;
    /** Sibling activity name, for additional activities whose ids are generated at parse. */
    activityName?: string;
    events: string[];
    oncePerTurn?: boolean;
    scale?: boolean;
    /** Roll attack/damage automatically instead of posting a card with buttons (default false). */
    autoRoll?: boolean;
    macroParameters?: string;
  }): I5eActivityBehavior {
    return BehaviorHelper.macro({
      ...common,
      name: common.name || activityName || "",
      handler: "useActivity",
      events,
      args: {
        ...(activityId !== undefined ? { activityId } : {}),
        ...(activityName !== undefined ? { activityName } : {}),
        ...(oncePerTurn !== undefined ? { oncePerTurn } : {}),
        ...(scale !== undefined ? { scale } : {}),
        ...(autoRoll !== undefined ? { autoRoll } : {}),
        ...(macroParameters !== undefined ? { macroParameters } : {}),
      },
    });
  }

}
