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
  /** Skip a token that already triggered this region during the current combat turn (default true). */
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
   * Whether this token already triggered this region during the current combat
   * turn; records the trigger when it has not. Outside combat nothing is
   * recorded and every event fires.
   */
  static async checkOncePerTurn(region: RegionDocument, token: TokenDocument, behavior?: { id?: string | null } | null): Promise<boolean> {
    if (!game.combat?.started || !token.actor) return true;
    // keyed per behavior so two behaviors on one region (e.g. Hunger of Hadar's
    // turn-start damage and turn-end save) do not suppress each other
    const flagName = `region${region.id}${behavior?.id ?? ""}Turn`;
    const current = {
      id: game.combat.id ?? null,
      round: game.combat.round ?? null,
      turn: game.combat.turn ?? null,
    };
    const previous = DDBEffectHelper.getFlag(token.actor, flagName) as typeof current | undefined;
    if (previous && previous.id === current.id && previous.round === current.round && previous.turn === current.turn) {
      logger.debug(`Region ${region.name} already triggered for ${token.name} this turn`);
      return false;
    }
    await DDBEffectHelper.setFlag(token.actor, flagName, current);
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

    if ((args.oncePerTurn ?? true) && !(await RegionAutomations.checkOncePerTurn(context.region, token, context.behavior))) return;

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

    if ((args.oncePerTurn ?? true) && !(await RegionAutomations.checkOncePerTurn(context.region, token, context.behavior))) return;

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
