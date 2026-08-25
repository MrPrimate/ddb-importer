import { DDBSimpleMacro, logger } from "../../lib/_module";
import DDBEffectHelper from "../DDBEffectHelper";

export interface IRegionEventContext {
  scene: Scene;
  region: RegionDocument;
  behavior: RegionBehavior;
  event: {
    name: string;
    data: Record<string, any>;
    region: RegionDocument;
    user: User;
  };
  handler: string;
  args: Record<string, unknown>;
}

/** Recorded against an actor by `checkOncePerTurn`; `key` is the trigger it collapses on. */
interface ITurnFlag {
  id: string | null;
  round: number | null;
  turn: number | null;
  key: string;
}

export type TRegionHandler = (context: IRegionEventContext, helpers: typeof RegionAutomations) => Promise<void> | void;

/**
 * Details of the region trigger, injected into the activity usage config as
 * `ddbRegionContext` and surfaced to macros on run by a ddbmacro activity
 * (`scope.regionContext` for DDB macros, `regionContext` for Foundry macros).
 */
export interface IDDBRegionContext {
  regionUuid: string;
  regionName: string | null;
  sceneUuid: string | null;
  behaviorUuid: string | null;
  eventName: string;
  tokenUuid: string | null;
  args: Record<string, unknown>;
}

interface IExecuteMacroArgs {
  /** `ddb.<type>.<file>` for a DDB Importer macro, or a Foundry macro name / `Macro.<id>` uuid. */
  macroFunction?: string;
  macroParameters?: string | Record<string, unknown>;
  oncePerTurn?: boolean;
}

interface IUseActivityArgs {
  /** Use this sibling activity of the placing activity instead of the placing activity itself. */
  activityName?: string;
  activityId?: string;
  /** Skip a token that already triggered this behavior during the current combat turn (default true). */
  oncePerTurn?: boolean;
  /** Also apply the region's cast spell level so upcast damage scales (default true). */
  scale?: boolean;
  /** For ddbmacro activities: use these macro parameters instead of the ones stored on the activity. */
  macroParameters?: string | Record<string, unknown>;
}

/**
 * Dispatch target for the "executeScript" RegionBehaviors placed by the
 * ddbMacro activity behavior. The script runs on every connected client, so
 * handlers are executed by the active GM only.
 */
export default class RegionAutomations {

  static handlerLabels: Record<string, string> = {};

  static register(name: string, handler: TRegionHandler, { label }: { label?: string } = {}) {
    RegionAutomations.handlers[name] = handler;
    if (label) RegionAutomations.handlerLabels[name] = label;
  }

  static handlerLabel(name: string): string {
    if (RegionAutomations.handlerLabels[name]) return RegionAutomations.handlerLabels[name];
    const key = `ddb-importer.behaviors.macro.handlers.${name}`;
    return game.i18n.has(key, false) ? game.i18n.localize(key) : name;
  }

  /** The activity that placed the region, from the flag dnd5e stamps at placement. */
  static async getActivity(region: RegionDocument): Promise<Record<string, any> | null> {
    const uuid = region.getFlag("dnd5e", "activity");
    if (!uuid) return null;
    return (await fromUuid(uuid)) as unknown as Record<string, any> | null;
  }

  /** The token that placed the region (e.g. the caster), if any. */
  static getOriginToken(region: RegionDocument): TokenDocument | null {
    const uuid = region.getFlag("dnd5e", "origin");
    if (!uuid) return null;
    return fromUuidSync(uuid) as unknown as TokenDocument | null;
  }

  /** The token the event was triggered for, if the event carries one. */
  static getEventToken(context: IRegionEventContext): TokenDocument | null {
    return (context.event.data?.token as TokenDocument | undefined) ?? null;
  }

  static buildRegionContext(context: IRegionEventContext, token: TokenDocument): IDDBRegionContext {
    return {
      regionUuid: context.region.uuid ?? "",
      regionName: context.region.name ?? null,
      sceneUuid: (context.scene as { uuid?: string } | null)?.uuid ?? null,
      behaviorUuid: (context.behavior as { uuid?: string } | null)?.uuid ?? null,
      eventName: context.event.name,
      tokenUuid: token.uuid ?? null,
      args: context.args ?? {},
    };
  }

  /**
   * Name of the flag recording that a token triggered a behavior this turn. The
   * region id leads so `pruneTurnFlags` can tell which region a flag belongs to.
   */
  static turnFlagName(regionId: string, behaviorId: string, tokenId: string): string {
    return `region${regionId}${behaviorId}${tokenId}Turn`;
  }

  /** `region<regionId><behaviorId><tokenId>Turn`, with Foundry's alphanumeric 16 character ids. */
  static TURN_FLAG_PATTERN = /^region[a-zA-Z0-9]{16,}Turn$/;

  static isTurnFlag(flagName: string): boolean {
    return RegionAutomations.TURN_FLAG_PATTERN.test(flagName);
  }

  /** The still-placed region a once-per-turn flag belongs to, or null when that region is gone. */
  static turnFlagRegionId(flagName: string, regionIds: Iterable<string>): string | null {
    if (!RegionAutomations.isTurnFlag(flagName)) return null;
    const body = flagName.slice("region".length, -"Turn".length);
    for (const id of regionIds) {
      if (id && body.startsWith(id)) return id;
    }
    return null;
  }

  /**
   * Drop once-per-turn flags that can never match again, so an actor does not
   * accumulate one per region/behavior/token it has ever triggered. A flag is
   * dead when its region is gone (the usual case: the region goes with the
   * spell) or when the combat it recorded no longer exists. Only world actors
   * are swept - an unlinked token's flags live in its actor delta and are
   * deleted with the token.
   */
  static async pruneTurnFlags({ dryRun = false }: { dryRun?: boolean } = {}): Promise<number> {
    const regionIds = new Set<string>();
    for (const scene of game.scenes ?? []) {
      for (const region of scene.regions ?? []) {
        if (region.id) regionIds.add(region.id);
      }
    }

    const updates: { _id: string; [key: string]: unknown }[] = [];
    let pruned = 0;
    for (const actor of game.actors ?? []) {
      const flags = foundry.utils.getProperty(actor, `flags.${DDBEffectHelper.FLAG_NAME}`) as Record<string, unknown> | undefined;
      if (!flags) continue;
      const update: Record<string, unknown> = {};
      for (const [flagName, value] of Object.entries(flags)) {
        if (!RegionAutomations.isTurnFlag(flagName)) continue;
        // keep it only while both the region and the combat it recorded survive
        const regionId = RegionAutomations.turnFlagRegionId(flagName, regionIds);
        const combatId = (value as { id?: string | null } | null)?.id;
        if (regionId !== null && combatId && game.combats?.get(combatId)) continue;
        // v14 replaced the legacy "-=key" deletion syntax with the ForcedDeletion operator
        update[`flags.${DDBEffectHelper.FLAG_NAME}.${flagName}`] = _del;
        pruned += 1;
      }
      if (!foundry.utils.isEmpty(update) && actor.id) updates.push({ _id: actor.id, ...update });
    }

    if (pruned === 0) return 0;
    logger.debug(`Pruning ${pruned} dead region once-per-turn flags from ${updates.length} actors`, { dryRun, updates });
    if (!dryRun) await Actor.updateDocuments(updates as unknown as Actor.UpdateInput[]);
    return pruned;
  }

  /**
   * The combat turn a region event belongs to. Turn and round events are
   * dispatched AFTER the combat document has advanced, so by the time a
   * `tokenTurnEnd` handler runs `game.combat.turn` is already the NEXT
   * combatant - only the event data carries the turn that actually ended.
   * Movement events (`tokenEnter` and friends) carry no turn data and happen
   * during the live turn. Null when there is no started combat to key on.
   */
  static getEventTurn(context: IRegionEventContext): { id: string | null; round: number | null; turn: number | null } | null {
    const data = (context.event?.data ?? {}) as {
      combat?: { id?: string | null; started?: boolean } | null;
      round?: number;
      turn?: number;
    };
    const combat = data.combat ?? game.combat;
    if (!combat?.started) return null;
    // a round event carries a round but no turn, so it keys on the round alone
    const fromEvent = data.round !== undefined;
    return {
      id: combat.id ?? null,
      round: (fromEvent ? data.round : game.combat?.round) ?? null,
      turn: (fromEvent ? data.turn : game.combat?.turn) ?? null,
    };
  }

  /**
   * Core dispatches the region events of ONE movement without awaiting any of
   * them (`Token##onUpdateHandleEnterExitMoveInOutRegionEvents` fires
   * `tokenEnter` and then `tokenMoveIn` back to back), so the read-modify-write
   * of the once-per-turn flag would interleave and let both handlers through -
   * `setFlag` is a socket round trip, and `getFlag` only sees it once the actor
   * update lands. Queueing the check on one slot serialises it. Only the CHECK
   * is queued, never the activity use, so a midi workflow waiting on a player
   * cannot hold up another region's events.
   */
  static #turnQueue = new foundry.utils.Semaphore(1);

  /**
   * Identity of the trigger a once-per-turn limit collapses on.
   * In combat that is the combat turn.
   * Out of combat there is no turn, so it is the movement.
   * Movement still collapses the several events one move raises on a behavior
   * listening to `tokenEnter`, `tokenMoveIn` and `tokenMoveWithin` together,
   * while a later, deliberate move back in triggers again.
   * Null when the event is neither, e.g. a token created inside a region out of combat.
   */
  static triggerKey(context: IRegionEventContext, turn = RegionAutomations.getEventTurn(context)): string | null {
    if (turn) return `combat${turn.id}r${turn.round}t${turn.turn}`;
    const movement = (context.event?.data as { movement?: { id?: string } | null } | undefined)?.movement;
    return movement?.id ? `movement${movement.id}` : null;
  }

  /**
   * Whether this token already triggered this behavior for the turn (or, out of
   * combat, the movement) the event belongs to; records the trigger when it has
   * not.
   *
   * The limit is per BEHAVIOR, so every event listed on one behavior shares it
   * (a behavior on `tokenEnter` + `tokenMoveIn` + `tokenTurnEnd` fires once a
   * turn, whichever came first), while sibling behaviors on the same region are
   * independent (Hunger of Hadar's turn-start cold damage and turn-end acid save
   * must both land). Per token as well as per actor, so two tokens sharing one
   * linked actor are tracked apart.
   */
  static checkOncePerTurn(context: IRegionEventContext, token: TokenDocument): Promise<boolean> {
    return RegionAutomations.#turnQueue.add(() => RegionAutomations.#recordTrigger(context, token)) as Promise<boolean>;
  }

  static async #recordTrigger(context: IRegionEventContext, token: TokenDocument): Promise<boolean> {
    if (!token.actor) return true;
    const turn = RegionAutomations.getEventTurn(context);
    const key = RegionAutomations.triggerKey(context, turn);
    if (!key) return true;

    const region = context.region;
    const flagName = RegionAutomations.turnFlagName(region.id ?? "", context.behavior?.id ?? "", token.id ?? "");
    const previous = DDBEffectHelper.getFlag(token.actor, flagName) as ITurnFlag | undefined;
    if (previous?.key === key) {
      logger.debug(`Region ${region.name} behavior already triggered for ${token.name} (${key})`, { context });
      return false;
    }
    // out-of-combat movement keys carry a null combat id, so pruneTurnFlags
    // sweeps them at the next world load - they could never match again
    await DDBEffectHelper.setFlag(token.actor, flagName, { ...(turn ?? { id: null, round: null, turn: null }), key });
    return true;
  }

  /**
   * Use an activity of the item that placed the region against the triggering
   * token: posts the usage (attack/save/damage card) with no consumption, no
   * dialog and no new template. Rolls through midi-qol when it is active so the
   * save/damage automation runs; otherwise the GM works the chat card.
   */
  static async useActivityHandler(context: IRegionEventContext): Promise<void> {
    const token = RegionAutomations.getEventToken(context);
    if (!token?.actor) return;

    const placingActivity = await RegionAutomations.getActivity(context.region);
    if (!placingActivity) {
      logger.warn(`No placing activity found for region ${context.region.name}`, { context });
      return;
    }

    const args = (context.args ?? {}) as IUseActivityArgs;
    const item = placingActivity.item;
    const activity = args.activityId
      ? item?.system?.activities?.get(args.activityId)
      : args.activityName
        ? item?.system?.activities?.find((a: { name: string }) => a.name === args.activityName)
        : placingActivity;
    if (!activity) {
      logger.warn(`No activity matching ${args.activityId ?? args.activityName} on ${item?.name} for region ${context.region.name}`, { context });
      return;
    }

    if ((args.oncePerTurn ?? true) && !(await RegionAutomations.checkOncePerTurn(context, token))) return;

    const spellLevel = context.region.getFlag("dnd5e", "spellLevel") as number | undefined;
    const baseLevel = item?.system?.level as number | undefined;
    const scaling = (args.scale ?? true) && spellLevel !== undefined && baseLevel !== undefined
      ? Math.max(0, spellLevel - baseLevel)
      : 0;

    const macroParameters = args.macroParameters === undefined
      ? undefined
      : typeof args.macroParameters === "string" ? args.macroParameters : JSON.stringify(args.macroParameters);
    const regionContext = RegionAutomations.buildRegionContext(context, token);
    const extraActivityConfig: Record<string, unknown> = { ddbRegionContext: regionContext };
    if (macroParameters !== undefined) extraActivityConfig.ddbMacroParameters = macroParameters;

    logger.debug(`Region ${context.region.name}: using ${activity.name} on ${token.name}`, { context, scaling, macroParameters });

    const previousTargets = [...((game.user as { targets?: Iterable<{ id: string | null }> }).targets ?? [])]
      .map((t) => t.id).filter((id): id is string => id !== null);
    DDBEffectHelper.setTokenTargets(token.id ? [token.id] : []);
    try {
      if (game.modules.get("midi-qol")?.active) {
        await DDBEffectHelper.rollMidiActivityUse(activity, {
          targets: [token.uuid],
          scaling,
          extraActivityConfig,
        });
      } else {
        await activity.use(
          {
            create: false,
            consume: { action: false, resource: false, spellSlot: false },
            scaling,
            ...extraActivityConfig,
          },
          { configure: false },
          {},
        );
      }
    } finally {
      DDBEffectHelper.setTokenTargets(previousTargets);
    }
  }

  /**
   * Run a macro directly, the way a ddbmacro activity would: `ddb.<type>.<file>`
   * functions go through DDBSimpleMacro, anything else is a Foundry macro
   * looked up by name or `Macro.<id>` uuid. The placing activity (when the
   * region came from one) supplies the actor/item context.
   */
  static async executeMacroHandler(context: IRegionEventContext): Promise<void> {
    const token = RegionAutomations.getEventToken(context);
    if (!token) return;

    const args = (context.args ?? {}) as IExecuteMacroArgs;
    const macroFunction = args.macroFunction;
    if (!macroFunction) {
      logger.warn(`executeMacro behavior on region ${context.region.name} has no macroFunction argument`, { context });
      return;
    }

    if ((args.oncePerTurn ?? true) && !(await RegionAutomations.checkOncePerTurn(context, token))) return;

    const placingActivity = await RegionAutomations.getActivity(context.region);
    const item = placingActivity?.item;
    const actor = item?.actor ?? token.actor;
    const parameters = args.macroParameters === undefined || args.macroParameters === null
      ? undefined
      : typeof args.macroParameters === "string" ? args.macroParameters : JSON.stringify(args.macroParameters);
    const regionContext = RegionAutomations.buildRegionContext(context, token);

    logger.debug(`Region ${context.region.name}: executing macro ${macroFunction} for ${token.name}`, { context, parameters });

    if (macroFunction.startsWith("ddb.")) {
      const macroParts = macroFunction.split(".");
      await DDBSimpleMacro.execute(macroParts[1] as TDDBMacroType, macroParts[2], {}, {
        actor: actor?.uuid ?? undefined,
        token: token.uuid ?? undefined,
        item: item?.uuid ?? undefined,
        origin: placingActivity?.uuid ?? (context.behavior as { uuid?: string } | null)?.uuid ?? undefined,
      }, {
        macroLabel: macroFunction,
        targetUuids: token.uuid ? [token.uuid] : [],
        parameters,
        regionContext,
      });
    } else {
      const macro = macroFunction.startsWith("Macro.")
        ? await fromUuid(macroFunction) as Macro.Implementation | null
        : game.macros.find((m) => m.name === macroFunction);
      if (!macro) {
        logger.warn(`executeMacro behavior on region ${context.region.name}: no macro found for "${macroFunction}"`, { context });
        return;
      }
      await macro.execute({
        macroLabel: macroFunction,
        targets: [token],
        token: token.uuid,
        actor,
        item,
        origin: placingActivity?.uuid ?? (context.behavior as { uuid?: string } | null)?.uuid,
        parameters,
        regionContext,
      } as unknown as Parameters<typeof macro.execute>[0]);
    }
  }

  static handlers: Record<string, TRegionHandler> = {
    log: (context) => {
      logger.debug(`Region event ${context.event.name} for ${context.region.name}`, context);
    },
    useActivity: (context) => RegionAutomations.useActivityHandler(context),
    executeMacro: (context) => RegionAutomations.executeMacroHandler(context),
  };

  static async handleRegionEvent(context: IRegionEventContext): Promise<void> {
    if (!game.user?.isActiveGM) return;
    const handler = RegionAutomations.handlers[context.handler];
    if (!handler) {
      logger.warn(`No region automation handler registered for "${context.handler}"`, context);
      return;
    }
    try {
      await handler(context, RegionAutomations);
    } catch (err) {
      logger.error(`Region automation "${context.handler}" failed`, err);
    }
  }

}
