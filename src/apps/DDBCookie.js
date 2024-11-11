import DDBMuncher from "../apps/DDBMuncher.js";
import { Secrets } from "../lib/_module.js";
import { SETTINGS } from "../config/_module.mjs";

export default class DDBCookie extends FormApplication {

  constructor(options, actor = null, localCobalt = false) {
    super(options);
    this.localCobalt = localCobalt;
    this.actor = actor;
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ddb-importer-cobalt-change";
    options.template = "modules/ddb-importer/handlebars/cobalt.hbs";
    options.width = 500;
    return options;
  }

  get title() { // eslint-disable-line class-methods-use-this
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Cobalt Cookie";
  }

  /** @override */
  async getData() {
    const keyPostFix = this.localCobalt && this.actor ? this.actor.id : null;
    const cobalt = Secrets.getCobalt(keyPostFix);
    const cobaltStatus = cobalt == "" ? { success: true } : await Secrets.checkCobalt();
    const expired = !cobaltStatus.success;

    return {
      expired: expired,
      cobaltCookie: cobalt,
      localCobalt: this.localCobalt && this.actor,
      actor: this.actor,
    };
  }

  /** @override */
  async _updateObject(event, formData) {
    event.preventDefault();
    const keyPostFix = this.localCobalt && this.actor ? this.actor.id : null;
    await Secrets.setCobalt(formData['cobalt-cookie'], keyPostFix);

    const cobaltStatus = await Secrets.checkCobalt();
    if (!cobaltStatus.success) {
      new DDBCookie().render(true);
    } else {
      const callMuncher = game.settings.get(SETTINGS.MODULE_ID, "settings-call-muncher");

      if (callMuncher) {
        game.settings.set(SETTINGS.MODULE_ID, "settings-call-muncher", false);
        new DDBMuncher().render(true);
      }
    }
  }
}
