import { DDBSimpleMacro, logger } from "../../lib/_module";
import MacroActivityData from "./MacroActivityData";
import MacroSheet from "./MacroSheet";

const BaseMacroActivity = dnd5e.documents.activity.ActivityMixin(MacroActivityData);

/**
 * Generic activity for applying effects and rolling an arbitrary die.
 */
export default class MacroActivity extends BaseMacroActivity {

  /** schema field defined by MacroActivityData; declared for the type system */
  declare macro: IDDBActivityMacro;

  /* -------------------------------------------- */
  /*  Model Configuration                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  static override LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, "ddb-importer.activities.macro"];

  /* -------------------------------------------- */

  /** @inheritDoc */
  static override metadata = Object.freeze(
    foundry.utils.mergeObject(super.metadata, {
      type: "ddbmacro",
      img: "systems/dnd5e/icons/svg/items/tool.svg",
      title: "ddb-importer.activities.macro.Title",
      sheetClass: MacroSheet,
      usage: {
        actions: {
          executeMacro: MacroActivity.#executeMacro,
        },
      },
    }, { inplace: false }) as unknown as typeof BaseMacroActivity.metadata,
  );

  /* -------------------------------------------- */
  /*  Activation                                  */
  /* -------------------------------------------- */

  /** @override */
  override async _usageChatButtons(message: Record<string, any>) {
    const superButtons = await super._usageChatButtons(message);
    if (!this.macro.function) return superButtons;
    const macroButton = {
      label: this.macro.name || game.i18n.localize("ddb-importer.activities.macro.Button"),
      icon: "<i class=\"fas fa-code\" inert></i>",
      dataset: {
        action: "executeMacro",
        visibility: this.macro.visible ? "all" : undefined,
      },
    } as unknown as (typeof superButtons)[number];
    return [macroButton].concat(superButtons);
  }

  async _executeDDBMacro(targetUuids: string[] = [], parametersOverride?: string, regionContext?: unknown) {

    // DDBSimpleMacro.execute treats absent ids by truthiness, so undefined is equivalent to null here
    const ids = {
      effect: undefined as string | undefined,
      actor: this.actor?.uuid ?? undefined,
      token: this.actor?.isOwner ? canvas.tokens.controlled[0]?.document?.uuid : undefined,
      item: this.item.uuid ?? undefined,
      origin: this.uuid,
    };
    const context = {};

    const macroParts = this.macro.function.split(".");

    const scope = {
      macroLabel: this.macro.name,
      activityId: this.id,
      activityItemName: this.item.name,
      functionParams: this.macro.name,
      activityActorUuid: this.actor?.uuid,
      activityItemUuid: this.item.uuid,
      targetUuids,
      parameters: parametersOverride ?? this.macro.parameters,
      regionContext,
    };

    logger.verbose("executing simple ddb macro", {
      this: this,
      ids,
      context,
      scope,
      macroParts,
    });

    await DDBSimpleMacro.execute(macroParts[1] as TDDBMacroType, macroParts[2], context, ids, scope);

  }

  async _executeFoundryMacro(targets: unknown[] = [], parametersOverride?: string, regionContext?: unknown) {
    let macro;
    if (this.macro.function.startsWith("Macro.")) {
      macro = await fromUuid(this.macro.function) as Macro.Implementation;
    } else {
      macro = game.macros.find((m) => m.name === this.macro.function);
    }

    if (macro) {
      await macro.execute({
        macroLabel: this.macro.name,
        targets,
        item: this.item,
        actor: this.actor,
        token: this.actor?.isOwner ? canvas.tokens.controlled[0]?.document?.uuid : null,
        activity: this,
        origin: this.uuid,
        parameters: parametersOverride ?? this.macro.parameters,
        regionContext,
      } as unknown as Parameters<typeof macro.execute>[0]);
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle running the macro on a click event.
   * @this {UtilityActivity}
   * @param {PointerEvent} _event     Triggering click event.
   * @param {HTMLElement} _target     The capturing HTML element which defined a [data-action].
   * @param {ChatMessage5e} _message  Message associated with the activation.
   */
  static #executeMacro(this: MacroActivity, _event: PointerEvent, _target: HTMLElement, _message: unknown) {
    const targets = Array.from(game.user.targets);

    if (this.macro.function.startsWith("ddb.")) {
      this._executeDDBMacro(targets.map((t) => t.document.uuid));
    } else {
      this._executeFoundryMacro(targets);
    }
  }

  /** @override */
  override async _triggerSubsequentActions(config: unknown, _results: unknown) {
    // this.rollDamage({ event: config.event }, {}, { data: { "flags.dnd5e.originatingMessage": results.message?.id } });

    const targets = Array.from(game.user.targets);
    // callers such as RegionAutomations.useActivity can override the stored macro
    // parameters and provide the triggering region's details via the usage config
    const usageConfig = config as { ddbMacroParameters?: string; ddbRegionContext?: unknown } | null;
    const parametersOverride = usageConfig?.ddbMacroParameters;
    const regionContext = usageConfig?.ddbRegionContext;

    if (this.macro.function.startsWith("ddb.")) {
      this._executeDDBMacro(targets.map((t) => t.document.uuid), parametersOverride, regionContext);
    } else {
      this._executeFoundryMacro(targets, parametersOverride, regionContext);
    }
  }
}
