import DDBMuncher from "../apps/DDBMuncher.js";
import { Secrets } from "../lib/_module.mjs";

export default class DDBCookie extends FormApplication {

  constructor({ actor = null, localCobalt = false, callMuncher = false, callback = null } = {}) {
    super({});
    this.localCobalt = localCobalt;
    this.actor = actor;
    this.callMuncher = callMuncher;
    this.callback = callback;
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

    const cobaltStatus = await Secrets.checkCobalt(keyPostFix);

    if (!cobaltStatus.success) {
      new DDBCookie({ actor: this.actor, localCobalt: this.localCobalt, callMuncher: this.callMuncher }).render(true);
    } else if (this.callMuncher) {
      new DDBMuncher().render(true);
    } else if (this.callback) {
      this.callback();
    }

  }
}
