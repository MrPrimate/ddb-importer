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
import {
  BUILTIN_REGION_DISPLAY_PROFILES,
  DEFAULT_REGION_DISPLAY_PROFILES,
  REGION_DISPLAY_BEHAVIOR_TYPE,
} from "../../../config/regionDisplayProfiles";
import RegionDisplayProfiles from "../../../lib/RegionDisplayProfiles";
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
  static applyEffect({
    effects,
    sizes = [],
    types = [],
    ...common
  }: IBehaviorCommon & {
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
  static macro({
    handler = "useActivity",
    events,
    args = {},
    sizes = [],
    types = [],
    excludeTypes = [],
    ...common
  }: IBehaviorCommon & {
    handler?: string;
    events: string[];
    args?: Record<string, unknown>;
    /** Only trigger for actors of these sizes (CONFIG.DND5E.actorSizes keys); empty = all. */
    sizes?: string[];
    /** Only trigger for these creature types (CONFIG.DND5E.creatureTypes keys); empty = all. */
    types?: string[];
    /** Never trigger for these creature types - "any creature other than an ooze" wording. */
    excludeTypes?: string[];
  }): I5eActivityBehavior {
    const {
      activityId,
      oncePerTurn,
      excludeSelf,
      scale,
      autoRoll,
      groupTargets,
      ownerTurn,
      ownerTurnTargets,
      fireOnPlacement,
      deleteAfterUse,
      macroParameters,
      macroFunction,
      enterOn,
      ...rest
    } = args as {
      activityId?: string;
      oncePerTurn?: boolean;
      excludeSelf?: boolean;
      scale?: boolean;
      autoRoll?: boolean;
      groupTargets?: boolean;
      ownerTurn?: boolean;
      ownerTurnTargets?: "region" | "none";
      fireOnPlacement?: boolean;
      deleteAfterUse?: boolean;
      macroParameters?: string;
      macroFunction?: string;
      enterOn?: TRegionEnterOn;
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
        excludeSelf: excludeSelf ?? false,
        scale: scale ?? true,
        // These two are structured fields rather than `args` entries because
        // DDBMacroActivityBehavior.createBehaviorData writes the schema value over a
        // same-named argument. Only the non-default value is written.
        ...(autoRoll === true ? { autoRoll } : {}),
        ...(groupTargets === false ? { groupTargets } : {}),
        ...(enterOn && enterOn !== "auto" ? { enterOn } : {}),
        ...(ownerTurn
          ? {
            ownerTurn,
            ownerTurnTargets: ownerTurnTargets ?? "region",
            fireOnPlacement: fireOnPlacement ?? false,
            deleteAfterUse: deleteAfterUse ?? false,
          }
          : {}),
        sizes,
        types,
        excludeTypes,
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
  static activity({
    activityId,
    activityName,
    events,
    oncePerTurn,
    excludeSelf,
    scale,
    autoRoll,
    groupTargets,
    enterOn,
    ownerTurn,
    ownerTurnTargets,
    fireOnPlacement,
    deleteAfterUse,
    activityChoices,
    skipOriginStatuses,
    fallbackDuration,
    macroParameters,
    sizes,
    types,
    excludeTypes,
    ...common
  }: IBehaviorCommon & {
    /** Sibling activity id to use; omit both to use the placing activity itself. */
    activityId?: string;
    /** Sibling activity name, for additional activities whose ids are generated at parse. */
    activityName?: string;
    events: string[];
    oncePerTurn?: boolean;
    /** Skip the token the region originates from: an emanation that does not affect its own caster. */
    excludeSelf?: boolean;
    /**
     * Which enters count as entering the area (TRegionEnterOn). The default, "auto", skips the
     * enters of the region's own creation when the placing activity already rolled for the
     * creatures inside. "movement" is the 2014 rule for "enters the area for the first time on a
     * turn" spells: only a creature passing into the area counts.
     */
    enterOn?: TRegionEnterOn;
    scale?: boolean;
    /** Roll attack/damage automatically instead of posting a card with buttons (default false). */
    autoRoll?: boolean;
    /**
     * Tokens triggered by one burst of region events (every token inside a newly
     * placed template) share a single usage card; `false` posts one card per token.
     */
    groupTargets?: boolean;
    macroParameters?: string;
    /** Only trigger for actors of these sizes (CONFIG.DND5E.actorSizes keys); empty = all. */
    sizes?: string[];
    /** Only trigger for these creature types (CONFIG.DND5E.creatureTypes keys); empty = all. */
    types?: string[];
    /** Never trigger for these creature types - "any creature other than an ooze" wording. */
    excludeTypes?: string[];
  } & Pick<
    I5eActivityBehaviorMacroConfig,
      | "ownerTurn"
      | "ownerTurnTargets"
      | "fireOnPlacement"
      | "deleteAfterUse"
      | "activityChoices"
      | "skipOriginStatuses"
      | "fallbackDuration"
  >): I5eActivityBehavior {
    return BehaviorHelper.macro({
      ...common,
      name: common.name || activityName || "",
      handler: "useActivity",
      events,
      sizes,
      types,
      excludeTypes,
      args: {
        ...(activityId !== undefined ? { activityId } : {}),
        ...(activityName !== undefined ? { activityName } : {}),
        ...(ownerTurn ? { ownerTurn, ownerTurnTargets, fireOnPlacement, deleteAfterUse } : {}),
        ...(activityChoices ? { activityChoices } : {}),
        ...(fallbackDuration !== undefined ? { fallbackDuration } : {}),
        ...(skipOriginStatuses?.length ? { skipOriginStatuses } : {}),
        ...(oncePerTurn !== undefined ? { oncePerTurn } : {}),
        ...(excludeSelf !== undefined ? { excludeSelf } : {}),
        ...(scale !== undefined ? { scale } : {}),
        ...(autoRoll !== undefined ? { autoRoll } : {}),
        ...(groupTargets !== undefined ? { groupTargets } : {}),
        ...(enterOn !== undefined ? { enterOn } : {}),
        ...(macroParameters !== undefined ? { macroParameters } : {}),
      },
    });
  }

  /**
   * Region display for the regions this activity places: a profile id from
   * `RegionDisplayProfiles` (including system damage and status icons) plus optional
   * overrides. Creates no RegionBehavior; the placement hook copies it onto the region.
   * Activities that declare none get a default at build time
   * (DDBActivityFactoryMixin._activityDisplayDefaults).
   */
  static display({
    profile,
    textureSrc,
    textureColorMode,
    textureAnchor,
    textureFit,
    pattern,
    opacity,
    gapOpacity,
    borderOpacity,
    spacing,
    thickness,
    edgeWidth,
    dashed,
    dashLength,
    angle,
    crossRotation,
    crossLength,
    waveAmplitude,
    waveLength,
    offset,
    border,
    borderWidth,
    color,
    ...common
  }: IBehaviorCommon & Omit<IRegionDisplayFlag, "profile"> & { profile: string }): I5eActivityBehavior {
    // the behavior's dashed and border fields are string choices; a boolean from an enricher maps onto them
    const dashedChoice = dashed === true ? "dashed" : dashed === false ? "continuous" : (dashed ?? "");
    const borderChoice = border === true ? "border" : border === false ? "none" : (border ?? "");
    // the name is saved on the imported document, so a general profile's stays English whatever
    // the world's language (the system presets carry dnd5e's own localized labels)
    const english = BUILTIN_REGION_DISPLAY_PROFILES.find((entry) => entry.id === profile)?.name;
    const shipped = RegionDisplayProfiles.builtin(profile);
    return {
      ...BehaviorHelper.#base(common, `Region Display: ${english ?? shipped?.name ?? profile}`),
      type: REGION_DISPLAY_BEHAVIOR_TYPE,
      config: {
        profile,
        pattern: pattern ?? "",
        textureSrc: textureSrc ?? "",
        textureColorMode: textureColorMode ?? "",
        textureAnchor: textureAnchor ?? "",
        textureFit: textureFit ?? "",
        opacity: opacity ?? null,
        gapOpacity: gapOpacity ?? null,
        borderOpacity: borderOpacity ?? null,
        spacing: spacing ?? null,
        thickness: thickness ?? null,
        edgeWidth: edgeWidth ?? null,
        dashed: dashedChoice,
        dashLength: dashLength ?? null,
        angle: angle ?? null,
        crossRotation: crossRotation ?? null,
        crossLength: crossLength ?? null,
        waveAmplitude: waveAmplitude ?? null,
        waveLength: waveLength ?? null,
        offset: offset ?? null,
        border: borderChoice,
        borderWidth: borderWidth ?? null,
        color: color ?? null,
      },
    };
  }

  /** Damage types named by an activity's damage parts. */
  static #damageTypes(activity: Partial<I5eActivity>): string[] {
    const parts = foundry.utils.getProperty(activity, "damage.parts") as { types?: string[] }[] | undefined;
    return (parts ?? []).flatMap((part) => part.types ?? []);
  }

  /** Status ids an effect applies: its `statuses`, or the DAE `macro.StatusEffect` changes that stand in for them. */
  static #effectStatuses(effect: I5eEffectData | undefined): string[] {
    if (!effect) return [];
    const changes = (foundry.utils.getProperty(effect, "system.changes") ?? []) as IActiveEffectChangeData[];
    const macroStatuses = changes
      .filter((change) => change.key === "macro.StatusEffect")
      .map((change) => String(change.value));
    return [...(effect.statuses ?? []), ...macroStatuses];
  }

  /** Status ids of the document effects an activity applies when used. */
  static #activityStatuses(activity: Partial<I5eActivity>, effects: I5eEffectData[]): string[] {
    const links = (foundry.utils.getProperty(activity, "effects") ?? []) as { _id?: string }[];
    const ids = new Set(links.map((link) => link._id));
    return effects.filter((effect) => ids.has(effect._id)).flatMap((effect) => BehaviorHelper.#effectStatuses(effect));
  }

  /**
   * Status ids an `applyActiveEffect` behavior applies. It names SRD condition uuids, or the
   * document's own and standalone effects by name, id or uuid.
   */
  static #behaviorStatuses(behavior: I5eActivityBehavior, effects: I5eEffectData[]): string[] {
    const config = (behavior.config ?? {}) as { effects?: string[] };
    return (config.effects ?? []).flatMap((reference) => {
      const status = SRDEffects.conditionStatus(reference);
      if (status) return [status];
      const effect = effects.find(
        (candidate) =>
          candidate.name === reference ||
          candidate._id === reference ||
          (candidate._id !== undefined && reference.endsWith(`.ActiveEffect.${candidate._id}`)),
      );
      return BehaviorHelper.#effectStatuses(effect);
    });
  }

  /**
   * The activities a `ddbMacro` trigger fires, found as the placed region finds them
   * (resolveRegionActivity): by id, else by name (exact, then prefix), else the placing
   * activity itself. An owner-turn trigger offering a choice fires each named activity, and a
   * macro function fires none.
   */
  static #triggeredActivities(
    behavior: I5eActivityBehavior,
    placing: Partial<I5eActivity>,
    activities: Record<string, Partial<I5eActivity>>,
  ): Partial<I5eActivity>[] {
    const config = (behavior.config ?? {}) as I5eActivityBehaviorMacroConfig;
    if (config.function && config.function !== "useActivity") return [];
    const args = (config.args ?? {}) as { activityId?: string; activityName?: string; activityChoices?: string[] };
    const id = config.activity || args.activityId;
    if (id) return activities[id] ? [activities[id]] : [];
    const choices = args.activityChoices ?? config.activityChoices ?? [];
    const names = choices.length > 0 ? choices : [args.activityName ?? ""];
    const siblings = Object.values(activities);
    return names.flatMap((name) => {
      if (!name) return [placing];
      const match =
        siblings.find((sibling) => sibling.name === name) ??
        siblings.find((sibling) => sibling.name?.startsWith(name) ?? false);
      return match ? [match] : [];
    });
  }

  /**
   * The system icon preset for a lone damage type or status (`damage-acid`, `status-prone`).
   * None, several, or one without a preset takes the generic profile for the category.
   */
  static #typedProfile(category: "damage" | "status", ids: string[]): string {
    const distinct = [...new Set(ids)];
    const preset = `${category}-${distinct[0]}`;
    if (distinct.length === 1 && RegionDisplayProfiles.builtin(preset)) return preset;
    return DEFAULT_REGION_DISPLAY_PROFILES[category];
  }

  /**
   * Assign a display profile to every activity that places an area or carries behaviors, and
   * has no `ddbDisplay` one yet. Emanations with behaviors read as auras. Otherwise the activity
   * and the siblings its triggers fire decide: any damage reads as damage, else any applied
   * status (or `applyActiveEffect` behavior) as a status effect, else minimal. A single damage
   * type or status takes its system icon preset, so a spell dealing acid damage and knocking
   * prone shows acid.
   * An area with no behaviors (Fireball, a one-shot emanation) gets the damage or status
   * profile only; with neither it keeps Foundry's own look rather than minimal.
   * A spell activity's template usually lives on the spell (dnd5e merges the item target
   * over activities that do not override theirs), so the document's type is the fallback.
   * Does nothing while the profiles are switched off.
   */
  static assignDisplayDefaults(
    activities: Record<string, Partial<I5eActivity>>,
    {
      documentTemplateType = "",
      effects = [],
      standaloneEffects = [],
    }: {
      /** The document's own `system.target.template.type`: an activity that does not override its target inherits it. */
      documentTemplateType?: string;
      /** The document's effects, which activities link by id. */
      effects?: I5eEffectData[];
      /** Standalone effects, which `applyActiveEffect` behaviors can name. */
      standaloneEffects?: I5eEffectData[];
    } = {},
  ): void {
    if (!RegionDisplayProfiles.enabled) return;
    const hasDamage = (activity: Partial<I5eActivity>): boolean => {
      const parts = foundry.utils.getProperty(activity, "damage.parts") as unknown[] | undefined;
      return (Array.isArray(parts) && parts.length > 0) || activity.type === "attack";
    };
    const allEffects = [...effects, ...standaloneEffects];
    for (const activity of Object.values(activities)) {
      const behaviors = Array.isArray(activity.behaviors) ? activity.behaviors : [];
      if (behaviors.some((behavior) => behavior.type === REGION_DISPLAY_BEHAVIOR_TYPE)) continue;
      const ownTemplateType = foundry.utils.getProperty(activity, "target.template.type") as string | undefined;
      const overridesTarget = foundry.utils.getProperty(activity, "target.override") === true;
      const templateType = ownTemplateType || (overridesTarget ? "" : documentTemplateType);
      const hasBehaviors = behaviors.length > 0;
      if (!hasBehaviors && !templateType) continue;
      let profile: string | null;
      if (templateType === "radius" && hasBehaviors) {
        profile = DEFAULT_REGION_DISPLAY_PROFILES.aura;
      } else {
        const triggered = behaviors
          .filter((behavior) => behavior.type === "ddbMacro")
          .flatMap((behavior) => BehaviorHelper.#triggeredActivities(behavior, activity, activities));
        const sources = [...new Set([activity, ...triggered])];
        const appliers = behaviors.filter((behavior) => behavior.type === "applyActiveEffect");
        const damaging = sources.filter(hasDamage);
        const statuses = [
          ...sources.flatMap((source) => BehaviorHelper.#activityStatuses(source, effects)),
          ...appliers.flatMap((behavior) => BehaviorHelper.#behaviorStatuses(behavior, allEffects)),
        ];
        if (damaging.length > 0) {
          const damageTypes = damaging.flatMap((source) => BehaviorHelper.#damageTypes(source));
          profile = BehaviorHelper.#typedProfile("damage", damageTypes);
        } else if (statuses.length > 0 || appliers.length > 0) {
          profile = BehaviorHelper.#typedProfile("status", statuses);
        } else {
          profile = hasBehaviors ? DEFAULT_REGION_DISPLAY_PROFILES.minimal : null;
        }
      }
      if (!profile) continue;
      activity.behaviors = [...behaviors, BehaviorHelper.display({ profile })];
    }
  }
}
