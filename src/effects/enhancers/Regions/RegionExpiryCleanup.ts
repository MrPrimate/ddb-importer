import { logger, utils } from "../../../lib/_module";
import type { IRegionExpiryEntry } from "./RegionExpiryDialog";
import { REGION_EXPIRY_REASONS as REASONS } from "./RegionExpiryReasons";

const FLAG = "dnd5e";
const LOG = "RegionExpiryCleanup |";
const DDB_FLAG = "ddbimporter";
const TIMER_FLAG = "regionExpiry";

/**
 * Activity duration units (singular, CONFIG.DND5E.timeUnits) mapped to ActiveEffect duration units (plural).
 * Only used when a prepared activity does not expose `duration.getEffectData`
 */
const ACTIVITY_TO_EFFECT_UNITS: Record<string, string> = {
  turn: "turns",
  round: "rounds",
  second: "seconds",
  minute: "minutes",
  hour: "hours",
  day: "days",
  month: "months",
  year: "years",
};

const COMBAT_UNITS = new Set(["rounds", "turns"]);

/**
 * Behavior types that delete their own applied effects when the region goes away.
 */
const SELF_CLEANING_BEHAVIORS = new Set(["dnd5e.applyActiveEffect"]);

/**
 * A placing activity's duration, snapshotted onto the region it created.
 *
 * Regions have no lifetime of their own, and many area features have no caster-side effect to
 * hang one on (a class-feature aura with no concentration and no self effect - Storm Aura -
 * places a region governed by nothing at all).
 *
 * This snapshot gives every activity-placed region an expiry taken from the duration on the activity.
 */
export interface IRegionExpiryTimer {
  /** ActiveEffect duration units: seconds/minutes/hours/days/months/years/rounds/turns. */
  units: string;
  value: number;
  /** `game.time.worldTime` when the region was placed. */
  startTime: number;
  /** Combat the region was placed during, for rounds/turns durations. */
  combat: string | null;
  startRound: number | null;
  activity: string | null;
}

type TActorDoc = Actor.Implementation;
type TEffectDoc = ActiveEffect.Implementation;
type TSceneDoc = Scene.Implementation;
type TCombatDoc = Combat.Implementation;

/** The subset of foundry.documents.modifyBatch used here; the function is not in fvtt-types yet. */
interface IModifyBatchDeleteOperation {
  action: "delete";
  documentName: string;
  parent: unknown;
  ids: string[];
}

type TModifyBatch = (operations: IModifyBatchDeleteOperation[]) => Promise<unknown>;

/**
 * Watches for Active Effects expiring or ending and asks the primary GM which of the
 * templates placed by the governing activity should be removed from their scene, along with
 * any Active Effects that the template's Region Behaviors applied to tokens.
 *
 * Why this is needed: dnd5e 6.0.x creates activity templates as Regions
 * (module/canvas/template-placement.mjs) but Regions are not wrapped in DependentMixin, so no
 * `flags.dnd5e.dependentOn` link is written.
 *
 * When the governing effect dies, ActiveEffect5e._onDeleteOperation deletes dependent effects/items,
 * but nothing deletes the Region. See dnd5e issues #4425, #4351, #2351 - retire this enhancer when the system fixes it.
 */
export default class RegionExpiryCleanup {

  /** Collapse a wave of simultaneous expiries into a single dialog. */
  static DEBOUNCE_MS = 250;

  /* -------------------------------------------- */
  /*  State                                       */
  /* -------------------------------------------- */

  /** Templates queued for confirmation, keyed by region uuid. */
  static #pending = new Map<string, IRegionExpiryEntry>();

  /** Region uuids the GM chose to keep this session; never re-offered automatically. */
  static #kept = new Set<string>();

  /** Is a confirmation dialog is currently open. */
  static #busy = false;

  // built lazily so evaluating this module never touches the foundry globals
  static #flushSoon: (() => void) | null = null;

  static #scheduleFlush(): void {
    RegionExpiryCleanup.#flushSoon ??= foundry.utils.debounce(() => {
      void RegionExpiryCleanup.#flush();
    }, RegionExpiryCleanup.DEBOUNCE_MS);
    RegionExpiryCleanup.#flushSoon();
  }

  /* -------------------------------------------- */

  /**
   * Only the primary GM performs the cleanup, matching the system's own idiom for
   * single-client side effects (active-effect.mjs, activity/mixin.mjs). The setting is read
   * per event rather than at registration so toggling it needs no reload and the watcher
   * fails over when the active GM changes mid-session.
   *
   * Setting gate without the active-GM requirement: the duration snapshot has to be written by
   * whichever client places the template, which is often a player.
   */
  static get #enabled(): boolean {
    return utils.getSetting<boolean>("enable-region-expiry-cleanup");
  }

  /* -------------------------------------------- */

  static get #active(): boolean {
    const isActiveGM = game.user?.isActiveGM ?? false;
    const enabled = utils.getSetting<boolean>("enable-region-expiry-cleanup");
    if (!isActiveGM || !enabled) {
      logger.verbose(`${LOG} inactive, ignoring event`, { isActiveGM, settingEnabled: enabled });
      return false;
    }
    return true;
  }

  /* -------------------------------------------- */
  /*  Flag normalisation                          */
  /* -------------------------------------------- */

  /**
   * Region flags store uuids as plain strings; concentration effect flags store them as
   * `{ type, id, uuid }` objects (active-effect.mjs createConcentrationEffectData).
   */
  static #flagUuid(value: unknown): string | null {
    if (typeof value === "string") return value || null;
    return (value as { uuid?: string } | null | undefined)?.uuid ?? null;
  }

  /** Resolve the uuid of the Activity an effect originated from. */
  static #effectActivityUuid(effect: TEffectDoc): string | null {
    return RegionExpiryCleanup.#flagUuid(foundry.utils.getProperty(effect, `flags.${FLAG}.activity`))
      ?? (effect.system as I5eEffectSystem | undefined)?.origin?.activity
      ?? null;
  }

  /** Resolve the uuid of the Item an effect originated from. */
  static #effectItemUuid(effect: TEffectDoc): string | null {
    return RegionExpiryCleanup.#flagUuid(foundry.utils.getProperty(effect, `flags.${FLAG}.item`))
      ?? (effect.system as I5eEffectSystem | undefined)?.origin?.item
      ?? effect.origin
      ?? null;
  }

  /** The actor that created an effect, falling back to the actor it is embedded in. */
  static #sourceActorOf(effect: TEffectDoc): TActorDoc | null {
    try {
      const actor = (effect as TEffectDoc & { getSourceActor?: () => TActorDoc | null }).getSourceActor?.() ?? null;
      if (actor) return actor;
    } catch (_err) {
      // getSourceActor resolves uuids that may be stale; fall through to the embedding actor
      logger.info(`${LOG} possible stale source actor, attempting parent fetch`);
    }
    if (effect.parent instanceof Actor) return effect.parent;
    return (effect.parent as Item.Implementation | undefined)?.actor ?? null;
  }

  /**
   * Whether an effect was applied by a region behavior, i.e. it is a region's output rather
   * than something that could govern one.
   *
   * dnd5e rewrites such an effect's `system.origin` to the placing activity/item
   * (data/region-behavior/apply-active-effect.mjs `#getEffectsToCreate`), because the origin
   * schema field always exists on a dnd5e-typed effect.
   *
   * That makes an applied marker look exactly like a caster-side effect from the activity,
   * and treating one as a governor is  circular: the region would be governed by an effect
   * it creates on entry and deletes on exit, so any token stepping out of the area would
   * offer the whole region for removal.
   */
  static #isBehaviorApplied(effect: TEffectDoc): boolean {
    if ((effect.system as I5eEffectSystem | undefined)?.origin?.behavior) return true;
    return (effect.origin ?? "").includes(".RegionBehavior.");
  }

  /* -------------------------------------------- */
  /*  Region timers                               */
  /* -------------------------------------------- */

  /**
   * Read the placing activity's duration in ActiveEffect duration terms
   */
  static #activityEffectDuration(activity: unknown): { value: number; units: string } | null {
    const duration = (activity as { duration?: Record<string, unknown> } | null)?.duration;
    if (!duration) return null;
    const getEffectData = duration["getEffectData"];
    const data = (typeof getEffectData === "function"
      ? (getEffectData as () => { value?: unknown; units?: string }).call(duration)
      : null) ?? {};
    const value = Number(data.value ?? duration["value"]);
    const units = data.units ?? ACTIVITY_TO_EFFECT_UNITS[String(duration["units"])];
    // "inst", "perm", "spec" and formula-valued durations yield nothing: those regions have no
    // intrinsic lifetime and keep the pre-existing governing-effect behaviour.
    if (!units || !Number.isFinite(value) || (value <= 0)) return null;
    return { value, units };
  }

  /**
   * Snapshot the placing activity's duration onto the regions it is about to create.
   *
   * Hooked on `dnd5e.createMeasuredTemplate`, which fires with the creation data before the
   * documents exist, so this needs no second write and no permission the placing user lacks.
   */
  static stampTemplateDurations(activity: unknown, regionData: Record<string, unknown>[]): void {
    if (!RegionExpiryCleanup.#enabled) return;
    const duration = RegionExpiryCleanup.#activityEffectDuration(activity);
    if (!duration) {
      logger.debug(`${LOG} activity declares no scalar duration, region gets no timer`, {
        activity: (activity as { uuid?: string } | null)?.uuid,
      });
      return;
    }
    const combat = game.combat;
    const timer: IRegionExpiryTimer = {
      ...duration,
      startTime: game.time?.worldTime ?? 0,
      combat: combat?.id ?? null,
      startRound: combat?.round ?? null,
      activity: (activity as { uuid?: string } | null)?.uuid ?? null,
    };
    for (const data of regionData ?? []) {
      foundry.utils.setProperty(data, `flags.${DDB_FLAG}.${TIMER_FLAG}`, timer);
    }
    logger.debug(`${LOG} stamped duration on ${regionData?.length ?? 0} region(s)`, timer);
  }

  /** The duration snapshot on a region, if it was placed while the watcher was enabled. */
  static #regionTimer(region: RegionDocument): IRegionExpiryTimer | null {
    const timer = foundry.utils.getProperty(region, `flags.${DDB_FLAG}.${TIMER_FLAG}`) as
      IRegionExpiryTimer | undefined;
    return (timer && Number.isFinite(timer.value) && timer.units) ? timer : null;
  }

  /**
   * Seconds left on a region's timer, or null when it cannot be evaluated.
   *
   * Time-based durations go through the calendar, matching core's own `ActiveEffect#_prepareTimeBasedDuration`.
   *
   * Rounds/turns are measured against the combat the region was placed in; if that combat is gone the elapsed
   * world time is used instead.
   */
  static #timerRemaining(timer: IRegionExpiryTimer): number | null {
    const worldTime = game.time?.worldTime ?? 0;
    if (COMBAT_UNITS.has(timer.units)) {
      const perUnit = Number((CONFIG.time as unknown as Record<string, unknown> | undefined)?.[
        timer.units === "turns" ? "turnTime" : "roundTime"
      ] ?? 0);
      const combat = timer.combat ? game.combats?.get(timer.combat) : null;
      if (combat && (timer.startRound !== null)) {
        const elapsed = (combat.round ?? 0) - timer.startRound;
        return (timer.value - elapsed) * (perUnit || 1);
      }
      // A turn-based duration with no turn clock cannot be judged; never expire on it.
      if (!perUnit) return null;
      return timer.startTime + (timer.value * perUnit) - worldTime;
    }
    const calendar = game.time?.calendar;
    if (!calendar) return null;
    const seconds = calendar.componentsToTime({ [timer.units.replace(/s$/, "")]: timer.value });
    if (!Number.isFinite(seconds)) return null;
    return timer.startTime + seconds - worldTime;
  }

  /* -------------------------------------------- */
  /*  Scene scanning                              */
  /* -------------------------------------------- */

  /**
   * Scenes worth scanning on an event: the one this client is viewing, the ones connected
   * players are viewing, and an optional extra (e.g. the scene of a just-deleted combat).
   *
   * Deliberately NOT every scene with a combat, and never the whole world - an event-driven
   * sweep should only touch what somebody is actually looking at. `scanAllScenes` is the
   * explicit, GM-invoked way to reach the rest.
   */
  static #candidateScenes(extra?: TSceneDoc | null): TSceneDoc[] {
    const scenes = new Set<TSceneDoc>();
    if (canvas?.scene) scenes.add(canvas.scene);
    if (extra) scenes.add(extra);
    for (const user of game.users ?? []) {
      if (!user.active || !user.viewedScene) continue;
      const scene = game.scenes?.get(user.viewedScene);
      if (scene) scenes.add(scene);
    }
    const candidates = Array.from(scenes);
    logger.verbose(`${LOG} candidate scenes`, candidates.map((scene) => scene.uuid));
    return candidates;
  }

  /** Every Region on a scene that was placed by an activity. */
  static #activityRegions(scene: TSceneDoc | null | undefined): RegionDocument[] {
    const regions = Array.from((scene?.regions ?? []) as Iterable<RegionDocument>);
    // dnd5e stamps flags.dnd5e.activity on every region it places (canvas/template-placement.mjs);
    // a region without it was hand-drawn and is never ours to remove.
    const activityRegions = regions.filter((r) => r.getFlag(FLAG, "activity"));
    logger.verbose(`${LOG} regions on ${scene?.uuid ?? "unknown scene"}`, {
      total: regions.length,
      activityPlaced: activityRegions.length,
      skipped: regions.filter((r) => !r.getFlag(FLAG, "activity")).map((r) => r.name ?? r.id),
    });
    return activityRegions;
  }

  /** Whether a region still exists in its scene. */
  static #stillExists(region: RegionDocument): boolean {
    const id = region.id;
    if (!id) return false;
    return region.parent?.regions?.has(id) ?? false;
  }

  /** The TokenDocument that originates the activity which placed this region. */
  static #regionOriginToken(region: RegionDocument): TokenDocument | null {
    const uuid = region.getFlag(FLAG, "origin");
    if (!uuid) return null;
    return (fromUuidSync(uuid, { strict: false }) as unknown as TokenDocument | null) ?? null;
  }

  /**
   * Active Effects that this region's behaviors applied to tokens, grouped by actor.
   *
   * Foundry v14 fires TOKEN_EXIT for contained tokens when a region is deleted, and dnd5e's
   * applyActiveEffect behavior removes its own applied effects then - but effects applied by
   * other behavior types (ddbMacro handlers, third-party behaviors) have no exit cleanup, so
   * they are deleted in the same transactional batch as the region.
   *
   * Matched on both `origin` and `system.origin.behavior`:
   * active-effect.mjs derives the former from the latter, but only after data preparation.
   */
  static #behaviorEffects(
    region: RegionDocument,
    { manualOnly = false }: { manualOnly?: boolean } = {},
  ): Map<TActorDoc, Set<string>> {
    const results = new Map<TActorDoc, Set<string>>();
    const behaviors = Array.from((region.behaviors ?? []) as Iterable<{ uuid: string | null; type?: string }>)
      .filter((behavior) => !manualOnly || !SELF_CLEANING_BEHAVIORS.has(behavior.type ?? ""));
    const uuids = new Set(behaviors.map((b) => b.uuid).filter((uuid) => uuid));
    if (!uuids.size) {
      logger.verbose(`${LOG} no behaviors to collect applied effects from`, { region: region.uuid, manualOnly });
      return results;
    }
    for (const token of (region.parent?.tokens ?? []) as Iterable<TokenDocument>) {
      const actor = token.actor;
      if (!actor) continue;
      for (const effect of actor.effects) {
        const behaviorOrigin = (effect.system as I5eEffectSystem | undefined)?.origin?.behavior;
        if ((effect.origin && uuids.has(effect.origin)) || (behaviorOrigin && uuids.has(behaviorOrigin))) {
          if (!results.has(actor)) results.set(actor, new Set());
          results.get(actor)?.add(effect.id as string);
        }
      }
    }
    logger.verbose(`${LOG} behavior-applied effects for region`, {
      region: region.uuid,
      behaviors: Array.from(uuids),
      actors: Array.from(results.entries()).map(([actor, ids]) => ({ actor: actor.uuid, effects: Array.from(ids) })),
    });
    return results;
  }

  /* -------------------------------------------- */
  /*  Matching                                    */
  /* -------------------------------------------- */

  /**
   * Find the templates governed by an effect across the candidate scenes.
   *
   * Match order, strongest first: activity uuid equality, then item uuid equality with the
   * region's casting token belonging to the effect's source actor.
   */
  static findTemplatesForEffect(effect: TEffectDoc, extraScene?: TSceneDoc | null): RegionDocument[] {
    if (RegionExpiryCleanup.#isBehaviorApplied(effect)) {
      logger.debug(`${LOG} "${effect.name ?? effect.id}" was applied by a region behavior, `
        + "not a governing effect", { effect: effect.uuid });
      return [];
    }
    const activityUuid = RegionExpiryCleanup.#effectActivityUuid(effect);
    const itemUuid = RegionExpiryCleanup.#effectItemUuid(effect);
    logger.debug(`${LOG} looking for templates governed by "${effect.name ?? effect.id}"`, {
      effect: effect.uuid,
      activityUuid,
      itemUuid,
      extraScene: extraScene?.uuid ?? null,
    });
    if (!activityUuid && !itemUuid) {
      // No origin at all: usually a hand-made effect, or one whose flags/system.origin were stripped.
      logger.debug(`${LOG} effect has no activity or item origin, no templates can match`, {
        effect: effect.uuid,
        flags: foundry.utils.getProperty(effect, `flags.${FLAG}`),
        systemOrigin: (effect.system as I5eEffectSystem | undefined)?.origin,
        origin: effect.origin,
      });
      return [];
    }
    const actor = RegionExpiryCleanup.#sourceActorOf(effect);
    const matches: RegionDocument[] = [];

    for (const scene of RegionExpiryCleanup.#candidateScenes(extraScene)) {
      for (const region of RegionExpiryCleanup.#activityRegions(scene)) {
        const regionActivity = region.getFlag(FLAG, "activity");
        if (activityUuid && (regionActivity === activityUuid)) {
          logger.debug(`${LOG} region matched on activity uuid`, { region: region.uuid, activityUuid });
          matches.push(region);
          continue;
        }
        const regionItem = region.getFlag(FLAG, "item");
        if (itemUuid && (regionItem === itemUuid)) {
          const tokenActor = RegionExpiryCleanup.#regionOriginToken(region)?.actor ?? null;
          const sameActor = !actor || !tokenActor || (tokenActor === actor);
          logger.debug(`${LOG} region matched on item uuid`, {
            region: region.uuid,
            itemUuid,
            sameActor,
            effectActor: actor?.uuid ?? null,
            regionCastingActor: tokenActor?.uuid ?? null,
          });
          if (sameActor) matches.push(region);
          continue;
        }
        logger.verbose(`${LOG} region did not match this effect`, {
          region: region.uuid,
          regionActivity,
          regionItem,
          activityUuid,
          itemUuid,
        });
      }
    }

    logger.debug(`${LOG} matched ${matches.length} template(s) for "${effect.name ?? effect.id}"`,
      matches.map((region) => region.uuid));
    return matches;
  }

  /** Find the live effect that keeps a template alive, if any. */
  static governingEffect(region: RegionDocument): TEffectDoc | null {
    const activityUuid = region.getFlag(FLAG, "activity");
    const itemUuid = region.getFlag(FLAG, "item");
    const actor = RegionExpiryCleanup.#regionOriginToken(region)?.actor
      ?? (itemUuid
        ? ((fromUuidSync(itemUuid, { strict: false }) as unknown as Item.Implementation | null)?.actor ?? null)
        : null);
    if (!actor) {
      // With no resolvable caster there is nothing to check the region against, so it is left
      // alone rather than swept - a deleted token would otherwise orphan every one of its regions.
      logger.debug(`${LOG} could not resolve the casting actor for region, skipping`, {
        region: region.uuid,
        activityUuid,
        itemUuid,
        originToken: region.getFlag(FLAG, "origin"),
      });
      return null;
    }

    for (const effect of actor.effects) {
      if (RegionExpiryCleanup.#isBehaviorApplied(effect)) continue;
      if (activityUuid && (RegionExpiryCleanup.#effectActivityUuid(effect) === activityUuid)) {
        logger.verbose(`${LOG} governing effect found by activity uuid`, {
          region: region.uuid, effect: effect.uuid,
        });
        return effect;
      }
      if (itemUuid && (RegionExpiryCleanup.#effectItemUuid(effect) === itemUuid)) {
        logger.verbose(`${LOG} governing effect found by item uuid`, {
          region: region.uuid, effect: effect.uuid,
        });
        return effect;
      }
    }
    logger.debug(`${LOG} no governing effect on ${actor.name ?? actor.uuid} for region`, {
      region: region.uuid,
      activityUuid,
      itemUuid,
      actorEffects: Array.from(actor.effects as Iterable<TEffectDoc>).map((effect) => ({
        name: effect.name,
        activity: RegionExpiryCleanup.#effectActivityUuid(effect),
        item: RegionExpiryCleanup.#effectItemUuid(effect),
      })),
    });
    return null;
  }

  /** Whether an effect's prepared duration marks it expired. */
  static #isExpired(effect: TEffectDoc): boolean {
    return (effect.duration as { expired?: boolean } | undefined)?.expired ?? false;
  }

  /**
   * Decide whether a region has outlived whatever governs it.
   *
   * Precedence:
   * 1. An elapsed duration snapshot expires the region outright.
   * 2. Otherwise a governing effect, if there is one, decides.
   * 3. A region with a RUNNING timer and no governing effect is alive - it governs itself.
   *    Without this an aura whose only effect is the one its own behavior applies (e.g. Storm Aura)
   *    would be offered for removal the moment the scene was next viewed.
   * 4. With neither, the pre-existing rule stands: nothing governs it, so it is stale.
   */
  static regionExpiry(region: RegionDocument): { expired: boolean; reason: string; remaining: number | null } {
    const timer = RegionExpiryCleanup.#regionTimer(region);
    const remaining = timer ? RegionExpiryCleanup.#timerRemaining(timer) : null;
    if ((remaining !== null) && (remaining <= 0)) {
      return { expired: true, reason: REASONS.duration, remaining };
    }
    const effect = RegionExpiryCleanup.governingEffect(region);
    if (effect) {
      return { expired: RegionExpiryCleanup.#isExpired(effect), reason: REASONS.expired, remaining };
    }
    if (remaining !== null) return { expired: false, reason: REASONS.duration, remaining };
    return { expired: true, reason: REASONS.scene, remaining };
  }

  /** Every activity template on a scene that has outlived its effect or its own duration. */
  static sweepScene(scene: TSceneDoc | null | undefined = canvas?.scene): RegionDocument[] {
    if (!scene) {
      logger.debug(`${LOG} sweep requested with no scene`);
      return [];
    }
    const orphaned = RegionExpiryCleanup.#activityRegions(scene).filter((region) => {
      const { expired, reason, remaining } = RegionExpiryCleanup.regionExpiry(region);
      logger.verbose(`${LOG} sweep verdict for ${region.uuid}`, { expired, reason, remaining });
      return expired;
    });
    logger.debug(`${LOG} swept ${scene.uuid}: ${orphaned.length} expired template(s)`,
      orphaned.map((region) => region.uuid));
    return orphaned;
  }

  /**
   * Regions whose own duration snapshot has run out, across the candidate scenes.
   *
   * Used by the time-based triggers, which must not pick up the "nothing governs it" case.
   * That is only swept at the deliberate moments (canvas ready, combat end).
   */
  static timerExpiredRegions(extraScene?: TSceneDoc | null): RegionDocument[] {
    const expired: RegionDocument[] = [];
    for (const scene of RegionExpiryCleanup.#candidateScenes(extraScene)) {
      for (const region of RegionExpiryCleanup.#activityRegions(scene)) {
        const timer = RegionExpiryCleanup.#regionTimer(region);
        if (!timer) continue;
        const remaining = RegionExpiryCleanup.#timerRemaining(timer);
        if ((remaining !== null) && (remaining <= 0)) {
          logger.debug(`${LOG} region duration elapsed`, { region: region.uuid, timer, remaining });
          expired.push(region);
        }
      }
    }
    return expired;
  }

  /**
   * Every activity-placed region on a scene that this watcher tracks, whether or not it has
   * expired yet: one carrying a duration snapshot, or one with a governing effect still live.
   *
   * These are the regions the expiry machinery would offer eventually, so a user can
   * bring that offer forward.
   *
   * Regions the watcher does not track are left alone:
   * - hand-drawn regions have no activity flag and never reach here
   * - a region with neither clock is not included (it is already stale, and `sweepScene` covers it).
   */
  static trackedRegions(scene: TSceneDoc | null | undefined): RegionDocument[] {
    if (!scene) return [];
    const tracked = RegionExpiryCleanup.#activityRegions(scene).filter((region) =>
      RegionExpiryCleanup.#regionTimer(region) || RegionExpiryCleanup.governingEffect(region));
    logger.debug(`${LOG} ${tracked.length} tracked region(s) on ${scene.uuid}`,
      tracked.map((region) => region.uuid));
    return tracked;
  }

  /* -------------------------------------------- */
  /*  Entry preparation & removal                 */
  /* -------------------------------------------- */

  /** Build the display data for one template. */
  static #prepareEntry(region: RegionDocument, reason: string): IRegionExpiryEntry {
    const behaviors = Array.from((region.behaviors ?? []) as Iterable<{ name?: string | null; type: string }>)
      .map((b) => b.name || game.i18n.localize(`TYPES.RegionBehavior.${b.type}`));

    const activityUuid = region.getFlag(FLAG, "activity");
    const activity = activityUuid
      ? (fromUuidSync(activityUuid, { strict: false }) as unknown as { item?: Item.Implementation; name?: string } | null)
      : null;
    const itemUuid = region.getFlag(FLAG, "item");
    const item = activity?.item
      ?? (itemUuid ? (fromUuidSync(itemUuid, { strict: false }) as unknown as Item.Implementation | null) : null);
    const token = RegionExpiryCleanup.#regionOriginToken(region);
    const actor = token?.actor ?? item?.actor ?? null;

    const dimensions = (region.getFlag(FLAG, "dimensions") ?? {}) as { size?: number; units?: string };
    const size = typeof dimensions.size === "number"
      ? `${dimensions.size} ${dimensions.units ?? region.parent?.grid?.units ?? ""}`.trim()
      : null;

    let effectCount = 0;
    for (const ids of RegionExpiryCleanup.#behaviorEffects(region).values()) effectCount += ids.size;

    const shapes = Array.from((region.shapes ?? []) as Iterable<{ type?: string }>);

    logger.verbose(`${LOG} prepared entry for ${region.uuid}`, {
      reason, behaviors, effectCount,
      item: item?.name ?? null,
      activity: activity?.name ?? null,
      token: token?.uuid ?? null,
    });

    return {
      region, behaviors, effectCount, reason,
      uuid: region.uuid as string,
      name: region.name || item?.name || "Template",
      img: (token?.texture?.src as string | undefined) ?? actor?.img ?? item?.img ?? "icons/svg/explosion.svg",
      itemName: item?.name ?? null,
      activityName: (activity?.name && (activity.name !== item?.name)) ? activity.name : null,
      shape: shapes.map((s) => s.type).find((type) => type) ?? null,
      size,
      spellLevel: (region.getFlag(FLAG, "spellLevel") as number | undefined) || null,
    };
  }

  /**
   * Delete the confirmed templates and their behaviors' applied effects in one batch.
   */
  static async removeTemplates(entries: IRegionExpiryEntry[]): Promise<void> {
    logger.debug(`${LOG} removing ${entries.length} confirmed template(s)`, entries.map((e) => e.uuid));
    if (!entries.length) return;
    const byParent = new Map<string, IModifyBatchDeleteOperation & { idSet: Set<string> }>();
    const key = (parent: { uuid?: string | null } | null, documentName: string) =>
      `${parent?.uuid ?? "world"}:${documentName}`;

    const push = (parent: unknown, documentName: string, id: string) => {
      const k = key(parent as { uuid?: string | null } | null, documentName);
      if (!byParent.has(k)) {
        byParent.set(k, { action: "delete", documentName, parent, ids: [], idSet: new Set() });
      }
      byParent.get(k)?.idSet.add(id);
    };

    // Recompute rather than trusting what was captured when the prompt was queued: tokens move
    // and effects come and go while the GM is deciding, and modifyBatch is transactional. a
    // single stale id would cancel the whole cleanup.
    let effectCount = 0;
    let templateCount = 0;
    for (const entry of entries) {
      if (!RegionExpiryCleanup.#stillExists(entry.region)) {
        logger.debug(`${LOG} template vanished before confirmation, skipping`, { region: entry.uuid });
        continue;
      }
      push(entry.region.parent, "Region", entry.region.id as string);
      templateCount++;
      // manualOnly: effects from self-cleaning behaviors are deleted by dnd5e's own TOKEN_EXIT
      // handling when the region below goes away, and racing it breaks the whole batch.
      for (const [actor, ids] of RegionExpiryCleanup.#behaviorEffects(entry.region, { manualOnly: true })) {
        for (const id of ids) {
          if (!actor.effects.has(id)) continue;
          push(actor, "ActiveEffect", id);
          effectCount++;
        }
      }
    }
    if (!byParent.size) {
      logger.debug(`${LOG} nothing left to delete after recomputing the batch`);
      return;
    }

    const batch = Array.from(byParent.values()).map(({ idSet, ...operation }) => ({
      ...operation,
      ids: Array.from(idSet),
    }));
    // v14 client/documents/_module.mjs - not in fvtt-types yet
    const modifyBatch = (foundry.documents as unknown as { modifyBatch: TModifyBatch }).modifyBatch;
    logger.debug(`${LOG} modifyBatch delete`, batch.map((operation) => ({
      documentName: operation.documentName,
      parent: (operation.parent as { uuid?: string } | null)?.uuid ?? "world",
      ids: operation.ids,
    })));
    try {
      await modifyBatch(batch);
    } catch (err) {
      // The batch is transactional, so anything another client removed between the recompute
      // above and the server processing the batch takes the region deletion down with it.
      // Retry with the regions alone: that is the part nothing else cleans up.
      const regionsOnly = batch.filter((operation) => operation.documentName === "Region");
      logger.warn(`${LOG} batch delete failed, retrying with regions only`, { err, batch });
      if (!regionsOnly.length) throw err;
      await modifyBatch(regionsOnly);
      effectCount = 0;
    }

    const parts = [`${templateCount} template${templateCount === 1 ? "" : "s"}`];
    if (effectCount) parts.push(`${effectCount} applied effect${effectCount === 1 ? "" : "s"}`);
    ui.notifications?.info(`Removed ${parts.join(" and ")}.`);
    logger.debug("RegionExpiryCleanup removed templates", { entries, batch });
  }

  /* -------------------------------------------- */
  /*  Queue                                       */
  /* -------------------------------------------- */

  /**
   * Queue templates for confirmation, deduplicating against what is already pending or was
   * previously kept by the GM.
   */
  static #queue(regions: RegionDocument[], reason: string): void {
    logger.debug(`${LOG} queue (${reason}): ${regions.length} candidate template(s)`,
      regions.map((region) => region.uuid));
    let queued = 0;
    for (const region of regions) {
      if (!region.uuid) continue;
      if (RegionExpiryCleanup.#pending.has(region.uuid)) {
        logger.verbose(`${LOG} already queued, skipping`, { region: region.uuid });
        continue;
      }
      if (RegionExpiryCleanup.#kept.has(region.uuid)) {
        logger.debug(`${LOG} GM kept this template earlier in the session, not re-offering`,
          { region: region.uuid });
        continue;
      }
      RegionExpiryCleanup.#pending.set(region.uuid, RegionExpiryCleanup.#prepareEntry(region, reason));
      queued++;
    }
    if (RegionExpiryCleanup.#pending.size) {
      logger.debug(`${LOG} ${queued} newly queued, ${RegionExpiryCleanup.#pending.size} pending; `
        + `flushing in ${RegionExpiryCleanup.DEBOUNCE_MS}ms`);
      RegionExpiryCleanup.#scheduleFlush();
    } else {
      logger.debug(`${LOG} nothing queued for this event`);
    }
  }

  /** Show the prompt for everything currently queued. */
  static async #flush(): Promise<void> {
    if (RegionExpiryCleanup.#busy || !RegionExpiryCleanup.#pending.size) {
      logger.debug(`${LOG} flush skipped`, {
        busy: RegionExpiryCleanup.#busy,
        pending: RegionExpiryCleanup.#pending.size,
      });
      return;
    }
    try {
      // Drop anything deleted while the prompt was queued, and anything the GM kept from a
      // dialog that was open while this entry re-queued (the expiry update and the later
      // effect deletion both queue the same region).
      const entries = Array.from(RegionExpiryCleanup.#pending.values())
        .filter((entry) => RegionExpiryCleanup.#stillExists(entry.region)
          && !RegionExpiryCleanup.#kept.has(entry.uuid));
      const dropped = RegionExpiryCleanup.#pending.size - entries.length;
      RegionExpiryCleanup.#pending.clear();
      if (!entries.length) {
        logger.debug(`${LOG} all ${dropped} pending template(s) were deleted or kept, no prompt`);
        return;
      }
      logger.debug(`${LOG} prompting for ${entries.length} template(s) (${dropped} dropped)`,
        entries.map((entry) => `${entry.name} [${entry.reason}]`));
      await RegionExpiryCleanup.#promptEntries(entries);
    } catch (err) {
      logger.error(`${LOG} flush failed`, err);
      throw err;
    } finally {
      // Anything queued while the dialog was open gets its own pass.
      if (RegionExpiryCleanup.#pending.size) RegionExpiryCleanup.#scheduleFlush();
    }
  }

  /* -------------------------------------------- */

  /**
   * Show the dialog for a prepared set of entries and act on the answer. Owns the `#busy` flag,
   * so both the debounced queue and the manual scan take the same path.
   * @returns how many templates the GM confirmed.
   */
  static async #promptEntries(entries: IRegionExpiryEntry[]): Promise<number> {
    if (!entries.length) return 0;
    RegionExpiryCleanup.#busy = true;
    try {
      const { default: RegionExpiryDialog } = await import(/* webpackMode: "eager" */ "./RegionExpiryDialog");
      const confirmed = await RegionExpiryDialog.prompt(entries);
      logger.debug(`${LOG} GM confirmed removal of ${confirmed?.length ?? 0} template(s)`, confirmed);
      const chosen = new Set(confirmed);
      for (const entry of entries) {
        if (!chosen.has(entry.uuid)) RegionExpiryCleanup.#kept.add(entry.uuid);
      }
      const removing = entries.filter((entry) => chosen.has(entry.uuid));
      await RegionExpiryCleanup.removeTemplates(removing);
      return removing.length;
    } finally {
      RegionExpiryCleanup.#busy = false;
    }
  }

  /* -------------------------------------------- */
  /*  Hook handlers                               */
  /* -------------------------------------------- */

  /**
   * An effect whose duration just ran out. Core's ActiveEffectRegistry persists
   * `duration.expired: true` on expiry, and in combat dnd5e leaves the effect in place until
   * the combatant exits (module/documents/combat.mjs _onExit), so this is the only signal
   * there. A chat-tray reapply persists `expired: false` - un-keep those regions so they are
   * offered again when the effect next dies.
   */
  static #onUpdateActiveEffect(effect: TEffectDoc, changed: { duration?: { expired?: boolean } }): void {
    if (!RegionExpiryCleanup.#active) return;
    const expired = changed?.duration?.expired;
    logger.verbose(`${LOG} updateActiveEffect "${effect.name ?? effect.id}"`, {
      effect: effect.uuid, expiredInUpdate: expired, changedKeys: Object.keys(changed ?? {}),
    });
    if (expired === false) {
      logger.debug(`${LOG} effect reapplied from the chat tray, un-keeping its templates`,
        { effect: effect.uuid });
      for (const region of RegionExpiryCleanup.findTemplatesForEffect(effect)) {
        if (region.uuid) RegionExpiryCleanup.#kept.delete(region.uuid);
      }
      return;
    }
    if (!expired) return;
    logger.debug(`${LOG} effect "${effect.name ?? effect.id}" expired`, { effect: effect.uuid });
    RegionExpiryCleanup.#queue(RegionExpiryCleanup.findTemplatesForEffect(effect), REASONS.expired);
  }

  /**
   * Covers the out-of-combat auto-delete (dnd5e active-effect.mjs _onUpdate), combat exit,
   * rest expiry, and manual deletion from the effects panel.
   */
  static #onDeleteActiveEffect(effect: TEffectDoc): void {
    if (!RegionExpiryCleanup.#active) return;
    const expired = RegionExpiryCleanup.#isExpired(effect);
    logger.debug(`${LOG} deleteActiveEffect "${effect.name ?? effect.id}"`,
      { effect: effect.uuid, expired });
    RegionExpiryCleanup.#queue(
      RegionExpiryCleanup.findTemplatesForEffect(effect),
      expired ? REASONS.expired : REASONS.deleted,
    );
  }

  /** Catch effects that expired in combat without emitting an update. */
  static #onUpdateCombat(combat: TCombatDoc, changed: Record<string, unknown>): void {
    if (!RegionExpiryCleanup.#active || (!("turn" in changed) && !("round" in changed))) return;
    const scene = (combat as { scene?: TSceneDoc | null }).scene ?? null;
    logger.debug(`${LOG} combat advanced, scanning combatants for expired effects`, {
      combat: combat.uuid, scene: scene?.uuid ?? null, round: combat.round, turn: combat.turn,
    });
    const regions: RegionDocument[] = [];
    for (const combatant of combat.combatants) {
      const actor = combatant.actor;
      if (!actor) continue;
      for (const effect of actor.effects) {
        if (RegionExpiryCleanup.#isExpired(effect)) {
          logger.debug(`${LOG} expired effect found on combatant ${actor.name ?? actor.uuid}`,
            { effect: effect.uuid, name: effect.name });
          regions.push(...RegionExpiryCleanup.findTemplatesForEffect(effect, scene));
        }
      }
    }
    RegionExpiryCleanup.#queue(regions, REASONS.expired);
    // Combat advancing is also the clock for rounds/turns durations.
    RegionExpiryCleanup.#queue(RegionExpiryCleanup.timerExpiredRegions(scene), REASONS.duration);
  }

  /* -------------------------------------------- */

  /**
   * World time advancing is the only signal for a region whose lifetime comes from its own
   * duration snapshot rather than an effect - the common case for area features with no
   * concentration and no caster-side effect.
   */
  static #onUpdateWorldTime(): void {
    if (!RegionExpiryCleanup.#active) return;
    RegionExpiryCleanup.#queue(RegionExpiryCleanup.timerExpiredRegions(), REASONS.duration);
  }

  /** Concentration broken via Actor5e#endConcentration. */
  static #onEndConcentration(_actor: TActorDoc, effect: TEffectDoc): void {
    if (!RegionExpiryCleanup.#active) return;
    logger.debug(`${LOG} concentration ended on "${effect.name ?? effect.id}"`, { effect: effect.uuid });
    RegionExpiryCleanup.#queue(RegionExpiryCleanup.findTemplatesForEffect(effect), REASONS.concentration);
  }

  /**
   * Sweep the combat's scene once combat is over, and additionally offer every region the
   * watcher tracks there even though its clock is still running.
   *
   * Nothing outside the tracked set is touched, and the GM can still Keep All.
   */
  static #onDeleteCombat(combat: TCombatDoc): void {
    if (!RegionExpiryCleanup.#active) return;
    const scene = (combat as { scene?: TSceneDoc | null }).scene ?? canvas?.scene ?? null;
    logger.debug(`${LOG} combat deleted, sweeping ${scene?.uuid ?? "no scene"}`);
    RegionExpiryCleanup.#queue(RegionExpiryCleanup.sweepScene(scene), REASONS.combat);
    RegionExpiryCleanup.#queue(RegionExpiryCleanup.trackedRegions(scene), REASONS.combat);
  }

  /** Sweep a scene when it is first viewed, catching leftovers from earlier sessions. */
  static #onCanvasReady(): void {
    if (!RegionExpiryCleanup.#active) return;
    logger.debug(`${LOG} canvas ready, sweeping ${canvas?.scene?.uuid ?? "no scene"} for leftovers`);
    RegionExpiryCleanup.#queue(RegionExpiryCleanup.sweepScene(canvas?.scene), REASONS.scene);
  }

  /* -------------------------------------------- */
  /*  Manual scan                                 */
  /* -------------------------------------------- */

  /**
   * Shared guard for the manual scans: only a GM can act on other people's scenes, and only one
   * prompt may be open at a time.
   */
  static #canScan(): boolean {
    if (!game.user?.isGM) {
      ui.notifications?.warn("Only a GM can scan scenes for expired templates.");
      return false;
    }
    if (RegionExpiryCleanup.#busy) {
      ui.notifications?.warn("A template cleanup prompt is already open.");
      return false;
    }
    return true;
  }

  /**
   * Offer one scene's expired templates.
   * Unlike the automatic sweeps this does NOT filter out templates kept earlier in the session
   * @param view  View the scene first, when it has something to show.
   */
  static async #scanScene(
    scene: TSceneDoc, { view = false }: { view?: boolean } = {},
  ): Promise<{ offered: number; removed: number }> {
    const candidates = RegionExpiryCleanup.sweepScene(scene)
      .filter((region) => RegionExpiryCleanup.#stillExists(region));
    if (!candidates.length) return { offered: 0, removed: 0 };
    if (view && (scene !== canvas?.scene)) await (scene as Scene.Implementation).view();
    const entries = candidates.map((region) => RegionExpiryCleanup.#prepareEntry(region, REASONS.scene));
    const removed = await RegionExpiryCleanup.#promptEntries(entries);
    return { offered: entries.length, removed };
  }

  /** Report a finished scan to the GM. */
  static #reportScan(what: string, summary: { offered: number; removed: number }): void {
    logger.info(`${LOG} manual scan complete: ${what}`, summary);
    ui.notifications?.info(summary.offered
      ? `Scanned ${what}, removed ${summary.removed} of `
        + `${summary.offered} template${summary.offered === 1 ? "" : "s"}.`
      : `Scanned ${what}, no expired templates found.`);
  }

  /**
   * Sweep the scene currently being viewed, re-offering templates kept earlier in the session.
   * Intended for a macro: `await DDBImporter.effects.RegionExpiry.scanCurrentScene()`
   */
  static async scanCurrentScene(): Promise<{ scanned: number; offered: number; removed: number }> {
    const summary = { scanned: 0, offered: 0, removed: 0 };
    if (!RegionExpiryCleanup.#canScan()) return summary;
    const scene = canvas?.scene ?? null;
    if (!scene) {
      ui.notifications?.warn("No scene is currently being viewed.");
      return summary;
    }
    summary.scanned = 1;
    Object.assign(summary, await RegionExpiryCleanup.#scanScene(scene));
    RegionExpiryCleanup.#reportScan("the current scene", summary);
    return summary;
  }

  /**
   * Sweep EVERY scene in the world, viewing each one that has candidates so the GM can see what
   * is being offered before answering, and prompting scene by scene. The view returns to
   * wherever the GM started once the scan finishes.
   *
   * Intended for a macro:
   * `await DDBImporter.effects.RegionExpiry.scanAllScenes()`
   *
   * Templates kept earlier in the session are re-offered here - the GM asked for this scan.
   */
  static async scanAllScenes(): Promise<{ scanned: number; offered: number; removed: number }> {
    const summary = { scanned: 0, offered: 0, removed: 0 };
    if (!RegionExpiryCleanup.#canScan()) return summary;

    const startingScene = canvas?.scene ?? null;
    for (const scene of game.scenes ?? []) {
      summary.scanned++;
      // The sweep reads documents, not the canvas, so a scene is only viewed once it has
      // something to show.
      const { offered, removed } = await RegionExpiryCleanup.#scanScene(scene, { view: true });
      summary.offered += offered;
      summary.removed += removed;
    }

    if (startingScene && (startingScene !== canvas?.scene) && game.scenes?.has(startingScene.id as string)) {
      await (startingScene as Scene.Implementation).view();
    }
    RegionExpiryCleanup.#reportScan(`${summary.scanned} scene${summary.scanned === 1 ? "" : "s"}`, summary);
    return summary;
  }

  /* -------------------------------------------- */
  /*  Diagnostics                                 */
  /* -------------------------------------------- */

  /**
   * Console diagnostic, callable as `DDBImporter.debug.regionExpiry.report()`.
   *
   * Two things account for almost every "nothing happens":
   * - the gate (setting off, or another GM is the active one)
   * - a region whose `flags.dnd5e.activity|item` never matches the effect that is supposed to govern it.
   *
   * This dumps both, plus what each region currently resolves to, without waiting for a hook to fire.
   */
  static report(): Record<string, unknown> {
    const isActiveGM = game.user?.isActiveGM ?? false;
    const settingEnabled = utils.getSetting<boolean>("enable-region-expiry-cleanup");

    const scenes = RegionExpiryCleanup.#candidateScenes().map((scene) => ({
      scene: scene.uuid,
      name: scene.name,
      regions: RegionExpiryCleanup.#activityRegions(scene).map((region) => {
        const effect = RegionExpiryCleanup.governingEffect(region);
        const timer = RegionExpiryCleanup.#regionTimer(region);
        let appliedEffects = 0;
        for (const ids of RegionExpiryCleanup.#behaviorEffects(region).values()) appliedEffects += ids.size;
        return {
          name: region.name,
          uuid: region.uuid,
          activity: region.getFlag(FLAG, "activity"),
          item: region.getFlag(FLAG, "item"),
          originToken: region.getFlag(FLAG, "origin"),
          behaviors: Array.from((region.behaviors ?? []) as Iterable<{ name?: string | null; type: string }>)
            .map((behavior) => `${behavior.name ?? "(unnamed)"} <${behavior.type}>`),
          appliedEffects,
          governingEffect: effect ? `${effect.name} [${effect.uuid}]` : null,
          effectExpired: effect ? RegionExpiryCleanup.#isExpired(effect) : null,
          timer,
          remainingSeconds: timer ? RegionExpiryCleanup.#timerRemaining(timer) : null,
          // the verdict the sweeps act on, and which of the two clocks produced it
          verdict: RegionExpiryCleanup.regionExpiry(region),
          keptThisSession: RegionExpiryCleanup.#kept.has(region.uuid as string),
        };
      }),
    }));

    const report = {
      active: isActiveGM && settingEnabled,
      isActiveGM,
      settingEnabled,
      // Decides which hook we hear about an expiry on:
      // "update" (core default) persists duration.expired and fires updateActiveEffect
      // "delete" removes the effect instead, anything else means an expired effect emits
      // no document event at all and only teh combat/scene sweeps will find it.
      expiryAction: (CONFIG.ActiveEffect as { expiryAction?: string }).expiryAction,
      busy: RegionExpiryCleanup.#busy,
      pending: Array.from(RegionExpiryCleanup.#pending.keys()),
      kept: Array.from(RegionExpiryCleanup.#kept),
      scenes,
    };
    logger.info(`${LOG} report`, report);
    return report;
  }

  /** Clear the session's "keep" decisions so those templates are offered again. */
  static forget(): void {
    logger.info(`${LOG} clearing ${RegionExpiryCleanup.#kept.size} kept region(s)`,
      Array.from(RegionExpiryCleanup.#kept));
    RegionExpiryCleanup.#kept.clear();
  }

  /* -------------------------------------------- */
  /*  Registration                                */
  /* -------------------------------------------- */

  /**
   * Register the watcher hooks.
   * Registered on every client.
   * Each handler gates on the setting and on being the active GM at event time (see #active).
   */
  static registerHooks(): void {
    Hooks.on<"dnd5e.createMeasuredTemplate">(
      "dnd5e.createMeasuredTemplate",
      (activity: unknown, regionData: Record<string, unknown>[]) => {
        RegionExpiryCleanup.stampTemplateDurations(activity, regionData);
      },
    );
    Hooks.on<"updateActiveEffect">("updateActiveEffect", (effect, changed) =>
      RegionExpiryCleanup.#onUpdateActiveEffect(
        effect as TEffectDoc,
        changed as { duration?: { expired?: boolean } },
      ));
    Hooks.on<"deleteActiveEffect">("deleteActiveEffect", (effect) =>
      RegionExpiryCleanup.#onDeleteActiveEffect(effect as TEffectDoc));
    Hooks.on<"updateCombat">("updateCombat", (combat, changed) =>
      RegionExpiryCleanup.#onUpdateCombat(combat as TCombatDoc, changed as Record<string, unknown>));
    Hooks.on<"deleteCombat">("deleteCombat", (combat) =>
      RegionExpiryCleanup.#onDeleteCombat(combat as TCombatDoc));
    Hooks.on<"dnd5e.endConcentration">("dnd5e.endConcentration", (actor, effect) =>
      RegionExpiryCleanup.#onEndConcentration(actor, effect));
    Hooks.on<"canvasReady">("canvasReady", () =>
      RegionExpiryCleanup.#onCanvasReady());
    Hooks.on<"updateWorldTime">("updateWorldTime", () =>
      RegionExpiryCleanup.#onUpdateWorldTime());
    logger.debug(`${LOG} hooks registered (updateActiveEffect, deleteActiveEffect, updateCombat, `
      + "deleteCombat, dnd5e.endConcentration, canvasReady, updateWorldTime, "
      + "dnd5e.createMeasuredTemplate). Each gates on the "
      + "'enable-region-expiry-cleanup' setting and on being the active GM at event time; "
      + "run DDBImporter.debug.regionExpiry.report() to see the current state.");
  }

}
