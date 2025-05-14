const { NumberField } = foundry.data.fields;


export default class CreateSpellwroughtTattooDialog extends dnd5e.applications.api.Dialog5e {

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Configuration options for tattoo creation.
   * @type {SpellwroughtTattooConfiguration}
   */
  #config;

  get config() {
    return this.#config;
  }

  /* -------------------------------------------- */

  /**
   * Spell from which the tattoo will be created.
   * @type {Item5e|object}
   */
  #spell;

  get spell() {
    return this.#spell;
  }

  constructor(options = {}) {
    super(options);
    this.#config = options.config;
    this.#spell = options.spell;
  }


  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["create-scroll"],
    window: {
      title: "DND5E.Scroll.CreateScroll",
      icon: "fa-solid fa-scroll",
    },
    form: {
      handler: CreateSpellwroughtTattooDialog.#handleFormSubmission,
    },
    position: {
      width: 420,
    },
    buttons: [{
      action: "create",
      label: "ddb-importer.tattoo.CreateSpellwroughtTattoo",
      icon: "fa-solid fa-scribble",
      default: true,
    }],
    config: null,
    spell: null,
  };

  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    content: {
      template: "modules/ddb-importer/handlebars/tattoo/create-spellwrought-tattoo-dialog.hbs",
    },
  };

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * Prepare rendering context for the content section.
   * @param {ApplicationRenderContext} context  Context being prepared.
   * @param {HandlebarsRenderOptions} _options   Options which configure application rendering behavior.
   * @returns {Promise<ApplicationRenderContext>}
   * @protected
   */
  async _prepareContentContext(context, _options) {
    context.anchor = this.spell instanceof Item ? this.spell.toAnchor().outerHTML : `<span>${this.spell.name}</span>`;
    context.config = this.config;
    context.fields = [{
      field: new NumberField({ label: game.i18n.localize("DND5E.SpellLevel") }),
      name: "level",
      options: Object.entries(CONFIG.DND5E.spellLevels)
        .map(([level, label]) => ({ value: level, label }))
        .filter((l) => Number(l.value) >= this.spell.system.level && Number(l.value) <= 5),
      value: this.config.level ?? this.spell.system.level,
    }];
    context.values = {
      bonus: new NumberField({ label: game.i18n.localize("DND5E.BonusAttack") }),
      dc: new NumberField({ label: game.i18n.localize("DND5E.Scroll.SaveDC") }),
    };
    context.valuePlaceholders = {};
    for (const level of Array.fromRange(this.config.level + 1).reverse()) {
      context.valuePlaceholders = CONFIG.DDBI.SPELLWROUGHT_TATTOO[level];
      if (context.valuePlaceholders) break;
    }
    return context;
  }


  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle submission of the dialog using the form buttons.
   * @this {CreateScrollDialog}
   * @param {Event|SubmitEvent} event    The form submission event.
   * @param {HTMLFormElement} form       The submitted form.
   * @param {FormDataExtended} formData  Data from the dialog.
   */
  static async #handleFormSubmission(event, form, formData) {
    foundry.utils.mergeObject(this.#config, formData.object);
    this.#config.level = Number(this.#config.level);
    await this.close({ dnd5e: { submitted: true } });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    const formData = new FormDataExtended(this.form);
    foundry.utils.mergeObject(this.#config, formData.object);
    this.#config.level = Number(this.#config.level);
    this.render({ parts: ["content"] });
  }

  /* -------------------------------------------- */

  /** @override */
  _onClose(options = {}) {
    if (!options.dnd5e?.submitted) this.#config = null;
  }

  /* -------------------------------------------- */
  /*  Factory Methods                             */
  /* -------------------------------------------- */

  /**
   * Display the create spell scroll dialog.
   * @param {Item5e|object} spell              The spell or item data to be made into a tattoo.
   * @param {SpellScrollConfiguration} config  Configuration options for tattoo creation.
   * @param {object} [options={}]              Additional options for the application.
   * @returns {Promise<object|null>}           Form data object with results of the dialog.
   */
  static async create(spell, config, options = {}) {
    return new Promise((resolve) => {
      const dialog = new this({ spell, config, ...options });
      dialog.addEventListener("close", (_event) => resolve(dialog.config), { once: true });
      dialog.render({ force: true });
    });
  }


}
