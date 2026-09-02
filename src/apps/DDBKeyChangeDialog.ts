import logger from "../lib/Logger";
import PatreonHelper, { type IPatreonLinkResponse } from "../lib/PatreonHelper";
import DDBAppV2 from "./DDBAppV2";
import DDBMuncher from "./DDBMuncher";


export default class DDBKeyChangeDialog extends DDBAppV2 {

  local: boolean;

  // Tracks whether the user actually completed an action (saved a key, or
  // declared they are no longer a supporter) rather than dismissing the
  // dialog.
  submitted = false;

  callback: (() => Promise<void> | void) | null;

  callMuncher: boolean;

  key: string;

  patreonUser: string;

  constructor(options: { local?: boolean; callback?: (() => Promise<void> | void) | null; callMuncher?: boolean } & Record<string, any> = {}) {
    super(options);
    this.local = options.local ?? false;
    this.callback = options.callback ?? null;
    this.callMuncher = options.callMuncher ?? false;

    this.key = PatreonHelper.getPatreonKey(this.local);
    this.patreonUser = this.key && this.key !== ""
      ? PatreonHelper.getPatreonUser(this.local)
      : "";
  }

  /** @override - this dialog has no tabs; base _prepareContext is fully overridden */
  _getTabs(): IDDBTabs {
    return {};
  }

  /** @override */
  static override DEFAULT_OPTIONS = {
    id: "ddb-importer-key-change",
    classes: ["standard-form", "dnd5e2"],
    window: {
      title: "ddb-importer.keychange.Update",
      icon: "fab fa-d-and-d-beyond",
    },
    tag: "form",
    actions: {
      connectToPatreonButton: DDBKeyChangeDialog.connectToPatreonButton,
      clearPatreonStatus: DDBKeyChangeDialog.clearPatreonStatus,
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
  static override PARTS = {
    ...super.PARTS,
    content: {
      template: "modules/ddb-importer/handlebars/keychange/ddb-key-change.hbs",
    },
    footer: { template: "modules/ddb-importer/handlebars/keychange/footer.hbs" },
  };

  override get title() {
    // improve localisation
    // game.i18n.localize("")
    return this.local ? "DDB Importer Local Key" : "DDB Importer Key Change";
  }


  override async _prepareContext(_options: any) {
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
    return context as unknown as DDBAppV2Context;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Handle submission of the dialog using the form buttons.
   * @this {CreateScrollDialog}
   * @param {Event|SubmitEvent} _event   The form submission event.
   * @param {HTMLFormElement} _form      The submitted form.
   * @param {FormDataExtended} formData  Data from the dialog.
   */
  static async #handleFormSubmission(this: DDBKeyChangeDialog, _event: any, _form: any, formData: any) {
    const currentKey = PatreonHelper.getPatreonKey(this.local);
    if (currentKey !== formData.object["patreon-key"]) {
      await PatreonHelper.setPatreonKey(formData.object["patreon-key"], this.local);
      await PatreonHelper.setPatreonTier(this.local);
      ui.controls?.render({ reset: true });
    }

    this.submitted = true;

    if (this.callback) {
      await this.callback();
    }

    if (this.callMuncher) {
      DDBMuncher.open();
    }
    await this.close({ dnd5e: { submitted: true } } as unknown as { submitted?: boolean });
  }

  /**
   * DDBSetup's handler writes this.patreonKey/this.patreonTier, but this dialog
   * renders from this.key/this.patreonUser
   */
  static async connectToPatreonButton(this: DDBKeyChangeDialog, event: Event) {
    event.preventDefault();
    await PatreonHelper.linkToPatreon(async (data: IPatreonLinkResponse) => {
      this.key = data.key;
      this.patreonUser = data.email;
      await this.render();
    });
  }

  static async clearPatreonStatus(this: DDBKeyChangeDialog, event: Event) {
    event.preventDefault();
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: { title: "No Longer a Patreon Supporter" },
      content: `<p>This clears your stored Patreon key.</p>
        <p>Patreon-only features will stop being offered until you link again.</p>
        <p>Are you sure?</p>`,
    });
    if (!confirmed) return;

    await PatreonHelper.clearPatreonStatus(this.local);
    this.key = "";
    this.patreonUser = "";
    ui.controls?.render({ reset: true });
    ui.notifications.info("Patreon supporter status cleared.");

    this.submitted = true;
    await this.close();
  }


  /* -------------------------------------------- */
  /*  Factory Methods                             */
  /* -------------------------------------------- */

  /**
   * Render the dialog and wait for the user to finish with it.
   * @param {object} [options={}] Application options, e.g. { local, callMuncher }.
   * @returns {Promise<boolean>}  True if the user saved a key or declared they
   *                              are no longer a supporter, false if they
   *                              cancelled or closed the dialog.
   */
  static async resolve(options: Record<string, any> = {}): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = new this(options);
      dialog.addEventListener("close", () => resolve(dialog.submitted), { once: true });
      dialog.render({ force: true });
    });
  }

}
