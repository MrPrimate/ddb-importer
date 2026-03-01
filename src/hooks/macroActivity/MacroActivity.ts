import { DDBSimpleMacro, logger } from "../../lib/_module";
import MacroActivityData from "./MacroActivityData";
import MacroSheet from "./MacroSheet";

/**
 * Generic activity for applying effects and rolling an arbitrary die.
 */
export default class MacroActivity extends dnd5e.documents.activity.ActivityMixin(MacroActivityData) {
  /* -------------------------------------------- */
  /*  Model Configuration                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  static LOCALIZATION_PREFIXES = [...super.LOCALIZATION_PREFIXES, "ddb-importer.activities.macro"];

  /* -------------------------------------------- */

  /** @inheritDoc */
  static metadata = Object.freeze(
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
    }, { inplace: false }),
  );

  /* -------------------------------------------- */
  /*  Activation                                  */
  /* -------------------------------------------- */

  /** @override */
  _usageChatButtons(message) {
    if (!this.macro.function) return super._usageChatButtons(message);
    return [{
      label: this.macro.name || game.i18n.localize("ddb-importer.activities.macro.Button"),
      icon: "<i class=\"fas fa-code\" inert></i>",
      dataset: {
        action: "executeMacro",
        visibility: this.macro.visible ? "all" : undefined,
      },
    }].concat(super._usageChatButtons(message));
  }

  async _executeDDBMacro(targetUuids = []) {

    const ids = {
      effect: null,
      actor: this.actor.uuid,
      token: this.actor?.isOwner ? canvas.tokens.controlled[0]?.document?.uuid : null,
      item: this.item.uuid,
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
      parameters: this.macro.parameters,
    };

    logger.verbose("executing simple ddb macro", {
      this: this,
      ids,
      context,
      scope,
      macroParts,
    });

    await DDBSimpleMacro.execute(macroParts[1], macroParts[2], context, ids, scope);

  }

  async _executeFoundryMacro(targets = []) {
    let macro;
    if (this.macro.function.startsWith("Macro.")) {
      macro = await fromUuid(this.macro.function);
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
        parameters: this.macro.parameters,
      });
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
  static #executeMacro(_event: PointerEvent, _target: HTMLElement, _message: ChatMessage5e) {
    const targets = Array.from(game.user.targets);

    if (this.macro.function.startsWith("ddb.")) {
      this._executeDDBMacro(targets.map((t) => t.document.uuid));
    } else {
      this._executeFoundryMacro(targets);
    }
  }

  /** @override */
  async _triggerSubsequentActions(_config, _results) {
    // this.rollDamage({ event: config.event }, {}, { data: { "flags.dnd5e.originatingMessage": results.message?.id } });

    const targets = Array.from(game.user.targets);

    if (this.macro.function.startsWith("ddb.")) {
      this._executeDDBMacro(targets.map((t) => t.document.uuid));
    } else {
      this._executeFoundryMacro(targets);
    }
  }
}
