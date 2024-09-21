import MacroActivityData from "./macroActivityData.js";
import MacroSheet from "./macroSheet.js";

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
      type: "macro",
      name: "Macro",
      img: "icons/anvil.png",
      title: "Macro Activity",
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
    if (!this.macro.formula) return super._usageChatButtons(message);
    return [{
      label: this.macro.name || "Execute Macro",
      icon: '<i class="fas fa-code" inert></i>',
      dataset: {
        action: "executeMacro",
        visibility: this.macro.visible ? "all" : undefined,
      },
    }].concat(super._usageChatButtons(message));
  }

  /* -------------------------------------------- */
  /*  Rolling                                     */
  /* -------------------------------------------- */

  // /**
  //  * Roll the formula attached to this utility.
  //  * @param {BasicRollProcessConfiguration} [config]   Configuration information for the roll.
  //  * @param {BasicRollDialogConfiguration} [dialog]    Configuration for the roll dialog.
  //  * @param {BasicRollMessageConfiguration} [message]  Configuration for the roll message.
  //  * @returns {Promise<BasicRoll[]|void>}              The created Roll instances.
  //  */
  // async rollFormula(config = {}, dialog = {}, message = {}) {
  //   if (!this.roll.formula) {
  //     console.warn(`No formula defined for the activity ${this.name} on ${this.item.name} (${this.uuid}).`);
  //     return;
  //   }

  //   const rollConfig = foundry.utils.deepClone(config);
  //   rollConfig.subject = this;
  //   rollConfig.rolls = [{ parts: [this.roll.formula], data: this.getRollData() }].concat(config.rolls ?? []);

  //   const dialogConfig = foundry.utils.mergeObject({
  //     configure: this.roll.prompt,
  //     options: {
  //       window: {
  //         title: this.item.name,
  //         subtitle: "DND5E.RollConfiguration.Title",
  //         icon: this.item.img,
  //       },
  //     },
  //   }, dialog);

  //   const messageConfig = foundry.utils.mergeObject({
  //     create: true,
  //     data: {
  //       flavor: `${this.item.name} - ${this.roll.label || game.i18n.localize("DND5E.OtherFormula")}`,
  //       flags: {
  //         dnd5e: {
  //           ...this.messageFlags,
  //           messageType: "roll",
  //           roll: { type: "generic" },
  //         },
  //       },
  //     },
  //   }, message);

  //   /**
  //    * A hook event that fires before a formula is rolled for a Utility activity.
  //    * @function dnd5e.preRollFormulaV2
  //    * @memberof hookEvents
  //    * @param {BasicRollProcessConfiguration} config   Configuration information for the roll.
  //    * @param {BasicRollDialogConfiguration} dialog    Configuration for the roll dialog.
  //    * @param {BasicRollMessageConfiguration} message  Configuration for the roll message.
  //    * @returns {boolean}                   Explicitly return `false` to prevent the roll from being performed.
  //    */
  //   if (Hooks.call("dnd5e.preRollFormulaV2", rollConfig, dialogConfig, messageConfig) === false) return;

  //   if ("dnd5e.preRollFormula" in Hooks.events) {
  //     foundry.utils.logCompatibilityWarning(
  //       "The `dnd5e.preRollFormula` hook has been deprecated and replaced with `dnd5e.preRollFormulaV2`.",
  //       { since: "DnD5e 4.0", until: "DnD5e 4.4" },
  //     );
  //     const hookData = {
  //       formula: rollConfig.rolls[0].parts[0], data: rollConfig.rolls[0].data, chatMessage: messageConfig.create,
  //     };
  //     if (Hooks.call("dnd5e.preRollFormula", this.item, hookData) === false) return;
  //     rollConfig.rolls[0].parts[0] = hookData.formula;
  //     rollConfig.rolls[0].data = hookData.data;
  //     messageConfig.create = hookData.chatMessage;
  //   }

  //   const rolls = await CONFIG.Dice.BasicRoll.build(rollConfig, dialogConfig, messageConfig);

  //   /**
  //    * A hook event that fires after a formula has been rolled for a Utility activity.
  //    * @function dnd5e.rollFormulaV2
  //    * @memberof hookEvents
  //    * @param {BasicRoll[]} rolls             The resulting rolls.
  //    * @param {object} data
  //    * @param {UtilityActivity} data.subject  The Activity that performed the roll.
  //    */
  //   Hooks.callAll("dnd5e.rollFormulaV2", rolls, { subject: this });

  //   if ("dnd5e.rollFormula" in Hooks.events) {
  //     foundry.utils.logCompatibilityWarning(
  //       "The `dnd5e.rollFormula` hook has been deprecated and replaced with `dnd5e.rollFormulaV2`.",
  //       { since: "DnD5e 4.0", until: "DnD5e 4.4" },
  //     );
  //     Hooks.callAll("dnd5e.rollFormula", this.item, rolls[0]);
  //   }

  //   return rolls;
  // }


  async executeMacro(config = {}, dialog = {}, message = {}) {
    if (!this.macro.function) {
      console.warn(`No macro defined for the activity ${this.name} on ${this.item.name} (${this.uuid}).`);
      return;
    }


    const macroConfig = foundry.utils.deepClone(config);

    // const target = event.target.closest('.roll-link, [data-action="rollRequest"], [data-action="concentration"]');

    console.warn("execute Macro", {
      config,
      dialog,
      message,
      this: this,
      // target,
    })

  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle running the macro on a click event.
   * @this {UtilityActivity}
   * @param {PointerEvent} event     Triggering click event.
   * @param {HTMLElement} target     The capturing HTML element which defined a [data-action].
   * @param {ChatMessage5e} message  Message associated with the activation.
   */
  static #executeMacro(event, target, message) {
    this.executeMacro({ event }, target, message);
  }
}
