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
        ...(macroParameters !== undefined ? { macroParameters } : {}),
      },
    });
  }

  /**
   * Region display for the regions this activity places: a profile id from
   * `RegionDisplayProfiles` (shipped: aura, damage, status, minimal) plus optional
   * overrides. Creates no RegionBehavior; the placement hook copies it onto the region.
   * Activities that declare none get a default at build time
   * (DDBActivityFactoryMixin._activityDisplayDefaults).
   */
  static display({
    profile,
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
    const shipped = BUILTIN_REGION_DISPLAY_PROFILES.find((entry) => entry.id === profile);
    return {
      ...BehaviorHelper.#base(common, `Region Display: ${shipped?.name ?? profile}`),
      type: REGION_DISPLAY_BEHAVIOR_TYPE,
      config: {
        profile,
        pattern: pattern ?? "",
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

  /**
   * Assign a display profile to every activity that carries behaviors but no
   * `ddbDisplay` one: emanations read as auras, triggers whose activity (or the sibling
   * they fire) deals damage as ongoing damage, effect-applying areas as status effects,
   * anything else as minimal. Activities with no behaviors keep Foundry's own look.
   * A spell activity's template usually lives on the spell (dnd5e merges the item target
   * over activities that do not override theirs), so the document's type is the fallback.
   * Does nothing while the profiles are switched off.
   */
  static assignDisplayDefaults(
    activities: Record<string, Partial<I5eActivity>>,
    { documentTemplateType = "" }: {
      /** The document's own `system.target.template.type`: an activity that does not override its target inherits it. */
      documentTemplateType?: string;
    } = {},
  ): void {
    if (!RegionDisplayProfiles.enabled) return;
    const hasDamage = (activity: Partial<I5eActivity> | undefined): boolean => {
      if (!activity) return false;
      const parts = foundry.utils.getProperty(activity, "damage.parts") as unknown[] | undefined;
      return (Array.isArray(parts) && parts.length > 0) || activity.type === "attack";
    };
    for (const activity of Object.values(activities)) {
      const behaviors = activity.behaviors;
      if (!Array.isArray(behaviors) || behaviors.length === 0) continue;
      if (behaviors.some((behavior) => behavior.type === REGION_DISPLAY_BEHAVIOR_TYPE)) continue;
      const ownTemplateType = foundry.utils.getProperty(activity, "target.template.type") as string | undefined;
      const overridesTarget = foundry.utils.getProperty(activity, "target.override") === true;
      const templateType = ownTemplateType || (overridesTarget ? "" : documentTemplateType);
      let profile: string;
      if (templateType === "radius") {
        profile = DEFAULT_REGION_DISPLAY_PROFILES.aura;
      } else {
        const triggers = behaviors.filter((behavior) => behavior.type === "ddbMacro");
        const applies = behaviors.some((behavior) => behavior.type === "applyActiveEffect");
        const triggersDamage = triggers.some((behavior) => {
          const config = (behavior.config ?? {}) as { activity?: string };
          const target = config.activity ? activities[config.activity] : undefined;
          return hasDamage(activity) || hasDamage(target);
        });
        if (triggersDamage) profile = DEFAULT_REGION_DISPLAY_PROFILES.damage;
        else if (applies) profile = DEFAULT_REGION_DISPLAY_PROFILES.status;
        else profile = DEFAULT_REGION_DISPLAY_PROFILES.minimal;
      }
      behaviors.push(BehaviorHelper.display({ profile }));
    }
  }
}
