import logger from "../lib/Logger.mjs";
import PatreonHelper from "../lib/PatreonHelper.mjs";
import DDBAppV2 from "./DDBAppV2.js";
import DDBMuncher from "./DDBMuncher.js";
import DDBSetup from "./DDBSetup.js";


export default class DDBKeyChangeDialog extends DDBAppV2 {

  constructor(options = {}) {
    super(options);
    this.local = options.local ?? false;
    this.callback = options.callback ?? null;
    this.callMuncher = options.callMuncher ?? false;

    this.key = PatreonHelper.getPatreonKey(this.local);
    this.patreonUser = this.key && this.key !== ""
      ? PatreonHelper.getPatreonUser(this.local)
      : "";
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "ddb-importer-key-change",
    classes: ["standard-form", "dnd5e2"],
    window: {
      title: "ddb-importer.keychange.Update",
      icon: 'fab fa-d-and-d-beyond',
    },
    tag: "form",
    actions: {
      connectToPatreonButton: DDBSetup.connectToPatreonButton,
    },
    form: {
      handler: DDBKeyChangeDialog.#handleFormSubmission,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    position: {
      width: 500,
    },
    buttons: [{
      action: "create",
      label: "ddb-importer.keychange.Update",
      icon: "fa-solid fa-user-pen",
      default: true,
    }],
  };

  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    content: {
      template: "modules/ddb-importer/handlebars/keychange/ddb-key-change.hbs",
    },
    footer: { template: "modules/ddb-importer/handlebars/keychange/footer.hbs" },
  };

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return this.local ? "DDB Importer Local Key" : "DDB Importer Key Change";
  }


  async _prepareContext(_options) {
    const newKey = !this.key || this.key === "";
    const check = newKey
      ? { success: true, message: "" }
      : await PatreonHelper.getPatreonValidity(this.key);
    const context = {
      success: (check && check.success) ? check.success : false,
      message: (check && check.message) ? check.message : "Unable to check patreon key status",
      key: this.key ?? "",
      patreonLinked: this.patreonUser && this.patreonUser !== "",
      patreonUser: this.patreonUser ?? "",
      local: this.local,
      tier: PatreonHelper.getPatreonTier(),
    };
    logger.debug("Settings: _prepareContext", context);
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
    const currentKey = PatreonHelper.getPatreonKey(this.local);
    if (currentKey !== formData.object['patreon-key']) {
      await PatreonHelper.setPatreonKey(formData.object['patreon-key'], this.local);
      await PatreonHelper.setPatreonTier(this.local);
    }

    if (this.callback) {
      await this.callback();
    }

    if (this.callMuncher) {
      new DDBMuncher().render(true);
    }
    await this.close({ dnd5e: { submitted: true } });
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
