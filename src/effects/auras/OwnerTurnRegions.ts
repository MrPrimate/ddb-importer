import logger from "../../lib/Logger";
import RegionBehaviorSettings from "../../lib/RegionBehaviorSettings";
import RegionAutomations, { type IRegionEventContext } from "./RegionAutomations";
import RegionTargetPrompt from "./RegionTargetPrompt";
import { ownerTurnExpired, regionLabel, resolveRegionActivity } from "./regionBehaviorUtils";

interface ITurnState {
  placement?: boolean;
  /** An actual one-shot use was attempted; a failure is retained for manual recovery. */
  oneShotClaimed?: boolean;
  /** Last claimed position per combat, origin token and edge; the containing behavior scopes the rest. */
  turns?: Record<string, { round: number; turn: number }>;
}

interface IHistory {
  round: number | null;
  turn: number | null;
  combatantId: string | null;
}

interface IPendingTrigger {
  controller: AbortController;
  alive: () => boolean;
}

interface IOwnerActivity extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
  target?: I5eActivityTarget;
  activation?: I5eActivityActivation;
}

/**
 * Dispatch owner turns independently of region membership, including stationary distant areas.
 *
 * Native token-turn region events require the acting token to occupy the region. These behaviors
 * instead follow flags.dnd5e.origin, even when the source leaves a stationary area. They have no
 * native turn-event subscriptions, so this dispatcher is their only turn-trigger path.
 *
 * Combat history and pending work are local coordination state. Claims live on RegionBehavior
 * documents so a reload or active-GM handoff cannot replay a turn already claimed. Only claim
 * writes are serialized; separate regions can resolve activities and wait for player choices
 * independently without holding up combat progression.
 */
export default class OwnerTurnRegions {

  // Serialize read/check/write claims in this client; Foundry document updates are not compare-and-set.
  static #claims = new foundry.utils.Semaphore(1);
  static #pending = new Set<IPendingTrigger>();
  // A temporary guard while resolving a one-shot, distinct from its persisted attempted-use marker.
  static #oneShots = new WeakSet<RegionBehavior.Implementation>();
  // Copy turn positions rather than retaining core's mutable previous/current state objects.
  static #history = new WeakMap<Combat, IHistory>();
  static #deleting = new WeakMap<RegionDocument.Implementation, Promise<void>>();

  /**
   * Coalesce completion and expiry requests while deletion is in flight. Turn, combat-deletion and
   * world-time hooks can overlap; checking membership also tolerates a region already removed by
   * another path. Evict failed promises too, so a later cleanup event can retry.
   */
  static #deleteRegion(region: RegionDocument.Implementation): Promise<void> {
    const pending = OwnerTurnRegions.#deleting.get(region);
    if (pending) return pending;
    const deletion = Promise.resolve()
      .then(async () => {
        if (RegionBehaviorSettings.enabled && game.user.isActiveGM && region.parent?.regions.some((entry) => entry === region)) await region.delete();
      })
      .finally(() => OwnerTurnRegions.#deleting.delete(region));
    OwnerTurnRegions.#deleting.set(region, deletion);
    return deletion;
  }

  /**
   * Seed a combat's history once, before asynchronous core turn events can mutate combat.previous.
   * Later updateCombat calls must not overwrite the last dispatched position: fast advances can
   * arrive before an earlier combatTurnChange hook. Every client remembers history, including a
   * client that may subsequently become the active GM.
   */
  static remember(combat: Combat, state: IHistory | undefined): void {
    if (state && !OwnerTurnRegions.#history.has(combat)) OwnerTurnRegions.#history.set(combat, { ...state });
  }

  /** Recognize the explicit dispatch flag; ordinary executeScript behaviors keep their native path. */
  static metadata(behavior: RegionBehavior.Implementation): IOwnerTurnBehavior | null {
    const data = foundry.utils.getProperty(behavior, "flags.ddbimporter.ownerTurn") as IOwnerTurnBehavior | undefined;
    return data?.args?.ownerTurn === true && Array.isArray(data.events) ? data : null;
  }

  /** Resolve the same alternatives for dispatch and reminder filtering, without doing any I/O. */
  static #activities(placing: Record<string, unknown>, args: IUseActivityArgs): IOwnerActivity[] {
    const candidates = args.activityChoices?.length
      ? args.activityChoices.map((activityName) => resolveRegionActivity(placing, { activityName }))
      : [resolveRegionActivity(placing, args)];
    return candidates.filter(
      (activity): activity is IOwnerActivity => !!activity?.id && !!activity.name && !!activity.type,
    );
  }

  /**
   * Remove only native reminders covered by a live owner-turn behavior. The system's hook is
   * synchronous and can precede our turn claims, so resolve loaded documents synchronously and
   * inspect configuration rather than claiming or executing anything. Token UUIDs, not actor
   * identity or attachment membership, distinguish sources sharing an actor and distant areas.
   * Empty areas and suppressed sources still belong to the dispatcher; neither needs a reminder.
   */
  static filterTurnReminder(
    combatant: Combatant.Implementation,
    messageConfig: Parameters<Hooks.Function<"dnd5e.preCreateCombatMessage">>[1],
  ): void {
    if (!RegionBehaviorSettings.enabled || !messageConfig.create || !combatant.parent?.started) return;
    const origin = combatant.token;
    const actor = combatant.actor;
    const scene = origin?.parent;
    const { system } = messageConfig.data;
    if (!actor || !origin?.uuid || !scene?.regions.size || !system.activations?.length) return;
    const events = new Set((system.periods ?? [])
      .filter((period) => period === "turnStart" || period === "turnEnd")
      .map((period) => `token${period[0].toUpperCase()}${period.slice(1)}`));
    if (!events.size) return;
    const covered = new Set<string>();
    for (const region of scene.regions) {
      if (region.getFlag("dnd5e", "origin") !== origin.uuid) continue;
      for (const behavior of region.behaviors) {
        const metadata = OwnerTurnRegions.metadata(behavior);
        if (!behavior.active || !metadata?.events.some((event) => events.has(event)) || ownerTurnExpired(behavior))
          continue;
        // Failed one-shot uses retain their region for manual recovery. An in-flight attempt is
        // still automated, but after it settles the native reminder must remain available.
        if (foundry.utils.getProperty(behavior, "flags.ddbimporter.ownerTurnState.oneShotClaimed")
          && !OwnerTurnRegions.#oneShots.has(behavior)) continue;
        const uuid = region.getFlag("dnd5e", "activity");
        if (typeof uuid !== "string") continue;
        const placing = fromUuidSync(uuid, { strict: false }) as unknown as Record<string, unknown> | null;
        if (!placing) continue;
        for (const activity of OwnerTurnRegions.#activities(placing, metadata.args)) {
          const period = activity.activation?.type;
          if (period !== "turnStart" && period !== "turnEnd") continue;
          const edge = period === "turnStart" ? "tokenTurnStart" : "tokenTurnEnd";
          if (events.has(edge) && metadata.events.includes(edge) && typeof activity.uuid === "string")
            covered.add(activity.uuid);
        }
      }
    }
    if (!covered.size) return;
    const remaining = system.activations.filter((uuid) => {
      const activity = fromUuidSync(uuid, { relative: actor, strict: false });
      return typeof activity?.uuid !== "string" || !covered.has(activity.uuid);
    });
    if (remaining.length === system.activations.length) return;
    system.activations = remaining;
    // Recovery notices share this card. Preserve rolls and unknown extension payloads too;
    // only a card containing nothing beyond the removed reminders may be suppressed.
    const hasContent = Object.entries(messageConfig.data).some(([key, value]) =>
      !["system", "speaker", "type", "whisper"].includes(key) && !foundry.utils.isEmpty(value))
      || Object.entries(system).some(([key, value]) =>
        !["periods", "origin"].includes(key) && !foundry.utils.isEmpty(value));
    if (!hasContent) messageConfig.create = false;
  }

  /**
   * Emit only the turn actually left and the turn actually entered, never intermediate skipped
   * combatants. Combat start has no outgoing edge; round rollover has both. Equal states and
   * rewinds have no edges, so correcting initiative does not replay earlier effects.
   */
  static edges(prior: IHistory, current: IHistory): { name: string; state: IHistory }[] {
    if (!current.round || current.turn === null) return [];
    if (current.round < (prior.round ?? 0) || (current.round === prior.round && current.turn < (prior.turn ?? 0)))
      return [];
    if (current.round === prior.round && current.turn === prior.turn && current.combatantId === prior.combatantId)
      return [];
    return [
      ...(prior.round && prior.turn !== null && prior.combatantId ? [{ name: "tokenTurnEnd", state: prior }] : []),
      ...(current.combatantId ? [{ name: "tokenTurnStart", state: current }] : []),
    ];
  }

  /**
   * Dispatch from our copied history, using the hook's prior state only when first encountering a
   * combat. Find regions in each origin token's scene, not the viewed canvas or selected combat.
   * Start jobs together after synchronous recipient snapshots; a chooser for one region must not
   * stall another. Hooks discard the returned promise, while tests can await all settled jobs.
   */
  static onTurn(combat: Combat.Implementation, prior: IHistory, current: IHistory): Promise<unknown[]> {
    if (!RegionBehaviorSettings.enabled) return Promise.resolve([]);
    const previous = OwnerTurnRegions.#history.get(combat) ?? { ...prior };
    const edges = OwnerTurnRegions.edges(previous, current);
    // Keep the high-water mark on rewinds and copy synchronously before any claim or prompt.
    if (edges.length || !OwnerTurnRegions.#history.has(combat)) OwnerTurnRegions.#history.set(combat, { ...current });
    if (!game.user.isActiveGM || !combat.started) return Promise.resolve([]);
    const jobs: Promise<void>[] = [];
    for (const { name, state } of edges) {
      const origin = combat.combatants.get(state.combatantId!)?.token;
      if (!origin?.parent) continue;
      for (const region of origin.parent.regions) {
        if (region.getFlag("dnd5e", "origin") !== origin.uuid) continue;
        for (const behavior of region.behaviors) {
          const metadata = OwnerTurnRegions.metadata(behavior);
          if (!behavior.active || !metadata?.events.includes(name)) continue;
          jobs.push(OwnerTurnRegions.run(region, behavior, origin, metadata, name, combat, state));
        }
      }
    }
    return Promise.allSettled(jobs);
  }

  /** Use the same claim/use lifecycle for an optional activation trigger, without requiring combat. */
  static onPlacement(behavior: RegionBehavior.Implementation): Promise<void> {
    if (!RegionBehaviorSettings.enabled) return Promise.resolve();
    const metadata = OwnerTurnRegions.metadata(behavior);
    if (!game.user.isActiveGM || !behavior.active || !metadata?.args.fireOnPlacement) return Promise.resolve();
    const region = behavior.parent;
    if (!region) return Promise.resolve();
    const origin = RegionAutomations.getOriginToken(region) as TokenDocument.Implementation | null;
    if (!origin) return Promise.resolve();
    return OwnerTurnRegions.run(region, behavior, origin, metadata, "ownerPlacement");
  }

  /**
   * Persist a trigger before activity resolution or prompting, including an empty or skipped choice.
   * Region and behavior identity are implicit in the document holding the state; the key separates
   * combats, source tokens sharing an actor, and start/end edges. Each key keeps a high-water mark
   * rather than an entry per turn. Placement is a separate, lifetime-once claim.
   *
   * The queue covers only this read/check/write operation, never player interaction. A one-shot
   * attempt is marked later, immediately before use, so cancellation here cannot permanently
   * disable an otherwise surviving region.
   */
  static async claim(context: IRegionEventContext, origin: TokenDocument.Implementation): Promise<boolean> {
    return OwnerTurnRegions.#claims.add(async () => {
      if (!RegionBehaviorSettings.enabled) return false;
      const behavior = context.behavior;
      const previous = foundry.utils.getProperty(behavior, "flags.ddbimporter.ownerTurnState") as
        | ITurnState
        | undefined;
      const state: ITurnState = foundry.utils.deepClone(previous ?? {});
      if (state.oneShotClaimed) return false;
      const update: Record<string, unknown> = { "flags.ddbimporter.ownerTurnState": state };
      if (context.event.name === "ownerPlacement") {
        if (state.placement) return false;
        state.placement = true;
      } else {
        const { combat, round, turn } = context.event.data as {
          combat: Combat.Implementation;
          round: number;
          turn: number;
        };
        const key = `${combat.id}${origin.id}${context.event.name}`;
        const prior = state.turns?.[key];
        if (prior && (prior.round > round || (prior.round === round && prior.turn >= turn))) return false;
        state.turns ??= {};
        // Retain only surviving combats. Foundry merges object updates, so removing a local key
        // also needs its v14 deletion operator or stale keys would accumulate in stored flags.
        for (const oldKey of Object.keys(state.turns)) {
          if (![...game.combats].some((entry) => oldKey.startsWith(entry.id))) {
            delete state.turns[oldKey];
            update[`flags.ddbimporter.ownerTurnState.turns.${oldKey}`] = _del;
          }
        }
        state.turns[key] = { round, turn };
      }
      await behavior.update(update as RegionBehavior.UpdateInput);
      return true;
    }) as Promise<boolean>;
  }

  /**
   * Resolve against the placing Item at trigger time so edited or deleted activities are respected.
   * Share exact-then-prefix lookup with native region execution; explicit alternatives such as
   * Crown's saves remain separate activities, preserving each variant's effect links.
   */
  static async resolveActivities(region: RegionDocument, args: IUseActivityArgs): Promise<IOwnerActivity[]> {
    const placing = await RegionAutomations.getActivity(region);
    if (!placing) throw new Error("The placing activity no longer exists");
    const activities = OwnerTurnRegions.#activities(placing, args);
    if (!activities.length) throw new Error("The triggered activity no longer exists");
    return activities;
  }

  /**
   * Bypass interaction for a fixed activity or recipient-free use. Otherwise derive choice/count
   * limits from the actual triggered activities, not their placing utility. RegionTargetPrompt
   * owns player routing, visibility, takeover and result validation; this method maps its result
   * back to the captured documents. Source-specific sight rules are carried as instructions.
   */
  static async selectActivity(
    region: RegionDocument,
    actor: Actor.Implementation,
    activities: IOwnerActivity[],
    tokens: TokenDocument.Implementation[],
    signal: AbortSignal,
  ): Promise<{ activity: IOwnerActivity; tokens: TokenDocument.Implementation[] } | null> {
    if (!actor.uuid || !region.uuid) return null;
    const activity = activities[0];
    if ((!activity.target?.affects?.choice && activities.length === 1) || !tokens.length) return { activity, tokens };
    const max = (candidate: IOwnerActivity) => {
      const count = Number(candidate.target?.affects?.count);
      return Number.isFinite(count) && count > 0 ? count : tokens.length;
    };
    const selected = await RegionTargetPrompt.choose(
      {
        id: foundry.utils.randomID(),
        actorUuid: actor.uuid,
        regionUuid: region.uuid,
        title: regionLabel(region),
        instruction: activity.activation?.condition ?? "",
        tokenUuids: tokens.flatMap((token) => (token.uuid ? [token.uuid] : [])),
        activities: activities.map((candidate) => ({ id: candidate.id, name: candidate.name, max: max(candidate) })),
        max: max(activity),
      },
      actor,
      signal,
    );
    if (!selected) return null;
    return {
      activity: activities.find((candidate) => candidate.id === selected.activity)!,
      tokens: tokens.filter((token) => token.uuid && selected.tokens.includes(token.uuid)),
    };
  }

  /**
   * Execute one edge for one behavior: snapshot, claim, resolve/choose, use, then complete.
   * Revalidate liveness after asynchronous boundaries because source documents, combat or GM
   * ownership can change while a dialog is open. Surviving snapshot recipients remain eligible
   * after movement; newly arrived tokens are never added to an already offered choice.
   *
   * A skipped, empty or suppressed one-shot completes by deleting its region. Cancellation before
   * use consumes only the edge claim and releases the temporary guard. An attempted use that
   * fails retains both the region and its persisted marker for manual recovery, avoiding an
   * automatic retry that could duplicate a partially completed activity.
   */
  static async run(
    region: RegionDocument.Implementation,
    behavior: RegionBehavior.Implementation,
    origin: TokenDocument.Implementation,
    metadata: IOwnerTurnBehavior,
    name: string,
    combat?: Combat.Implementation,
    state?: IHistory,
  ): Promise<void> {
    const scene = region.parent;
    const originScene = origin.parent;
    const originId = origin.id;
    const actor = origin.actor;
    const actorUuid = actor?.uuid;
    const regionUuid = region.uuid;
    if (
      !RegionBehaviorSettings.enabled ||
      !game.user.isActiveGM ||
      !behavior.active ||
      !actor ||
      !scene ||
      !originScene ||
      !originId ||
      !actorUuid ||
      !regionUuid
    )
      return;
    const args = metadata.args;
    const suppressed = args.skipOriginStatuses?.some((status) => actor.statuses.has(status));
    const context: IRegionEventContext = {
      scene,
      region,
      behavior,
      event: { name, data: { token: origin, combat, round: state?.round, turn: state?.turn }, region, user: game.user },
      handler: "useActivity",
      args: metadata.args,
    };
    // RegionBehavior creation can precede core's asynchronous token-membership update.
    // On placement use core's containment test directly, without waiting or mutating membership.
    const candidates =
      name === "ownerPlacement"
        ? [...scene.tokens.values()].filter((token) => token.testInsideRegion(region))
        : [...region.tokens];
    // Snapshot before the first await: movement while a choice is open cannot add recipients.
    const occupants = candidates.filter(
      (token) =>
        token.actor &&
        RegionAutomations.matchesTokenFilters(token, args) &&
        !(args.excludeSelf && RegionAutomations.isOriginToken(context, token)),
    );
    const controller = new AbortController();
    const pending: IPendingTrigger = {
      controller,
      // behavior.active already covers hidden/disabled regions and embedded-document membership.
      alive: () =>
        RegionBehaviorSettings.enabled &&
        game.user.isActiveGM &&
        behavior.active &&
        originScene.tokens.get(originId) === origin &&
        !!origin.actor &&
        (!combat || (!!combat.id && game.combats.get(combat.id) === combat && combat.started)) &&
        !ownerTurnExpired(behavior) &&
        !!fromUuidSync(region.getFlag("dnd5e", "activity") as string),
    };
    if (args.deleteAfterUse && OwnerTurnRegions.#oneShots.has(behavior)) return;
    if (args.deleteAfterUse) OwnerTurnRegions.#oneShots.add(behavior);
    OwnerTurnRegions.#pending.add(pending);
    try {
      if (!pending.alive() || !(await OwnerTurnRegions.claim(context, origin)) || !pending.alive()) return;
      if (suppressed) {
        if (args.deleteAfterUse) await OwnerTurnRegions.#deleteRegion(region);
        return;
      }
      const activities = await OwnerTurnRegions.resolveActivities(region, args);
      const selected = await OwnerTurnRegions.selectActivity(
        region,
        actor,
        activities,
        args.ownerTurnTargets === "none" ? [] : occupants,
        controller.signal,
      );
      if (!selected) {
        if (!controller.signal.aborted && pending.alive() && args.deleteAfterUse)
          await OwnerTurnRegions.#deleteRegion(region);
        return;
      }
      const { activity } = selected;
      let { tokens } = selected;
      if (controller.signal.aborted || !pending.alive()) return;
      // Deleted tokens cannot be used, but surviving snapshot members need not still be inside.
      tokens = tokens.filter((token) => token.id && token.parent?.tokens.get(token.id) === token);
      if (tokens.length || args.ownerTurnTargets === "none") {
        // Persist only when an actual use is attempted. A failed use stays for manual recovery;
        // cancellation before use consumes only this turn's claim and can run on a later turn.
        if (args.deleteAfterUse) {
          await behavior.update({
            "flags.ddbimporter.ownerTurnState.oneShotClaimed": true,
          } as RegionBehavior.UpdateInput);
          if (controller.signal.aborted || !pending.alive()) {
            await behavior.update({
              "flags.ddbimporter.ownerTurnState.oneShotClaimed": _del,
            } as RegionBehavior.UpdateInput);
            return;
          }
        }
        // Native/Midi activities share one card by default. Existing per-token macros keep their
        // execution model; the shared helper suppresses consumption, templates and concentration.
        const groups =
          (args.groupTargets === false || activity.type === "ddbmacro") && tokens.length
            ? tokens.map((token) => [token])
            : [tokens];
        for (const group of groups) {
          if (!pending.alive()) return;
          const used = await RegionAutomations.useActivityOnTokens(context, activity, args, group);
          if (!used || (typeof used === "object" && "aborted" in used && used.aborted)) {
            throw new Error("The activity did not complete; use its manual follow-up to recover");
          }
        }
      }
      // Successful use completes the one-shot even if its combat ended while the card was being created.
      if (args.deleteAfterUse) await OwnerTurnRegions.#deleteRegion(region);
    } catch (error) {
      logger.error(`Owner-turn region ${region.name} failed`, error);
      ui.notifications.warn(
        game.i18n.format("ddb-importer.behaviors.macro.ownerTurnFailure", { region: region.name ?? "" }),
      );
    } finally {
      controller.abort();
      OwnerTurnRegions.#pending.delete(pending);
      OwnerTurnRegions.#oneShots.delete(behavior);
    }
  }

  /**
   * Abort obsolete prompts on document/lifecycle changes. Their owning run releases pending state
   * in finally, and RegionTargetPrompt closes obsolete dialogs and rejects late replies. A player
   * disconnect alone is not a cancellation or automatic takeover while the source remains live.
   */
  static cancelMissing(): void {
    for (const pending of OwnerTurnRegions.#pending) {
      if (!pending.alive()) pending.controller.abort();
    }
  }

  /**
   * Clean up explicit one-shot fallbacks across all scenes, even with generic expiry disabled.
   * ownerTurnExpired defers the fallback while the placement combat is running, protecting the
   * next-turn eruption from round-expiry ordering, and retains failed attempted uses for recovery.
   * Ordinary aura lifetimes are not deleted by this fallback scan.
   */
  static async cleanupExpired(): Promise<void> {
    if (!RegionBehaviorSettings.enabled || !game.user.isActiveGM) return;
    for (const scene of game.scenes) {
      for (const region of [...scene.regions]) {
        if (
          ![...region.behaviors].some(
            (behavior) =>
              OwnerTurnRegions.metadata(behavior)?.args.fallbackExpiresAt !== undefined && ownerTurnExpired(behavior),
          )
        )
          continue;
        try {
          await OwnerTurnRegions.#deleteRegion(region);
        } catch (error) {
          logger.error(`Owner-turn region ${region.name} could not expire`, error);
        }
      }
    }
  }

  /**
   * Install event-driven dispatch and invalidation; there is no recurring timer or canvas poll.
   * Seed history on ready/creation, launch turn work without blocking the combat hook, and cancel
   * pending choices when their dependencies change. Cleanup on ready also handles an overdue
   * fallback after reload; the deletion guard coalesces overlapping lifecycle events.
   */
  static registerHooks(): void {
    if (!RegionBehaviorSettings.enabled) return;
    Hooks.on<"dnd5e.preCreateCombatMessage">("dnd5e.preCreateCombatMessage", (combatant, messageConfig) => {
      OwnerTurnRegions.filterTurnReminder(combatant, messageConfig);
    });
    Hooks.on<"ready">("ready", () => {
      for (const combat of game.combats) OwnerTurnRegions.remember(combat, combat.current);
      void OwnerTurnRegions.cleanupExpired();
    });
    Hooks.on<"createCombat">("createCombat", (combat) => OwnerTurnRegions.remember(combat, combat.current));
    Hooks.on<"combatTurnChange">("combatTurnChange", (combat, prior, current) => {
      void OwnerTurnRegions.onTurn(combat, prior, current);
    });
    Hooks.on<"createRegionBehavior">("createRegionBehavior", (behavior) => {
      void OwnerTurnRegions.onPlacement(behavior);
    });
    Hooks.on<"deleteRegion">("deleteRegion", () => OwnerTurnRegions.cancelMissing());
    Hooks.on<"deleteRegionBehavior">("deleteRegionBehavior", () => OwnerTurnRegions.cancelMissing());
    Hooks.on<"deleteToken">("deleteToken", () => OwnerTurnRegions.cancelMissing());
    Hooks.on<"deleteActor">("deleteActor", () => OwnerTurnRegions.cancelMissing());
    Hooks.on<"deleteItem">("deleteItem", () => OwnerTurnRegions.cancelMissing());
    Hooks.on<"deleteCombat">("deleteCombat", (combat) => {
      OwnerTurnRegions.#history.delete(combat);
      OwnerTurnRegions.cancelMissing();
      void OwnerTurnRegions.cleanupExpired();
    });
    Hooks.on<"updateCombat">("updateCombat", (combat) => {
      OwnerTurnRegions.remember(combat, combat.previous);
      OwnerTurnRegions.cancelMissing();
      void OwnerTurnRegions.cleanupExpired();
    });
    Hooks.on<"updateRegionBehavior">("updateRegionBehavior", () => OwnerTurnRegions.cancelMissing());
    Hooks.on<"updateRegion">("updateRegion", () => OwnerTurnRegions.cancelMissing());
    Hooks.on<"updateWorldTime">("updateWorldTime", () => {
      OwnerTurnRegions.cancelMissing();
      void OwnerTurnRegions.cleanupExpired();
    });
    Hooks.on<"userConnected">("userConnected", () => OwnerTurnRegions.cancelMissing());
  }
}
