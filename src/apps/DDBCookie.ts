import DDBMuncher from "../apps/DDBMuncher";
import { Secrets } from "../lib/_module";

export default class DDBCookie extends FormApplication {

  localCobalt: boolean;

  actor: TImporterActor | null;

  callMuncher: boolean;

  callback: (() => Promise<void> | void) | null;

  constructor({ actor = null, localCobalt = false, callMuncher = false, callback = null }: {
    actor?: TImporterActor | null;
    localCobalt?: boolean;
    callMuncher?: boolean;
    callback?: (() => Promise<void> | void) | null;
  } = {}) {
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

  get title() {
    // improve localisation
    // game.i18n.localize("")
    return "DDB Importer Cobalt Cookie";
  }

  /** @override */
  async getData() {
    const keyPostFix = this.localCobalt && this.actor ? this.actor.id ?? undefined : undefined;
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
  async _updateObject(event: any, formData: any) {
    event.preventDefault();
    const keyPostFix = this.localCobalt && this.actor ? this.actor.id ?? undefined : undefined;
    await Secrets.setCobalt(formData["cobalt-cookie"], keyPostFix);

    const cobaltStatus = await Secrets.checkCobalt(keyPostFix);

    if (!cobaltStatus.success) {
      new DDBCookie({ actor: this.actor, localCobalt: this.localCobalt, callMuncher: this.callMuncher }).render(true);
    } else if (this.callMuncher) {
      new DDBMuncher().render({ force: true });
    } else if (this.callback) {
      this.callback();
    }

  }
}
