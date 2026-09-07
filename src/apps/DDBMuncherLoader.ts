import { DICTIONARY } from "../config/_module";
import DDBAppV2, { IDDBTabs } from "./DDBAppV2";

/**
 * Thrown from a loading step once the user has cancelled, so the caller can
 * tell a cancellation apart from a real failure. Throwing from the muncher's
 * first `_prepareContext` is a clean abort: ApplicationV2 runs it before the
 * frame is built, so no window is created and no instance is registered.
 */
export class DDBMuncherLoadCancelled extends Error {
  constructor() {
    super("DDB Muncher load cancelled");
    this.name = "DDBMuncherLoadCancelled";
  }
}

/**
 * A small progress dialog shown while the muncher runs its start-up calls
 * (cookie and Patreon checks, campaign and encounter lists, mule lists,
 * compendium indexes). It is never re-rendered: every update is a direct DOM
 * write through notifierV2, so the bar cannot be reset under the user.
 *
 * Cancel is cooperative. The button (or the window close) aborts a controller
 * and the orchestration checks it between steps; requests already in flight
 * are left to finish and warm the caches for the next open.
 */
export default class DDBMuncherLoader extends DDBAppV2 {

  static QUIP_INTERVAL_MS = 10000;

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-muncher-loader",
    classes: ["standard-form", "dnd5e2", "ddb-muncher-loader"],
    window: {
      title: "Loading DDB Muncher",
      icon: "fab fa-d-and-d-beyond",
      minimizable: false,
      resizable: false,
    },
    position: {
      width: 420,
      height: "auto" as const,
    },
    actions: {
      cancel: DDBMuncherLoader.cancel,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/muncher/loader.hbs",
    },
  };

  #controller = new AbortController();

  #current = 0;

  #quipInterval: ReturnType<typeof setInterval> | null = null;

  /** Number of steps the bar counts up to. */
  total: number;

  constructor({ total = 1 }: { total?: number } = {}) {
    super();
    this.total = total;
  }

  _getTabs(): IDDBTabs {
    return {};
  }

  get signal(): AbortSignal {
    return this.#controller.signal;
  }

  get cancelled(): boolean {
    return this.#controller.signal.aborted;
  }

  /** Steps reported so far. */
  get current(): number {
    return this.#current;
  }

  /** A random loading quip from the muncher list. */
  static randomQuip(): string {
    const quips = DICTIONARY.messages.loading.muncher;
    if (!quips?.length) return "";
    return quips[Math.floor(Math.random() * quips.length)];
  }

  /** @override - no tabs and no compendium cache load; this dialog must open instantly */
  async _prepareContext(_options: any): Promise<any> {
    return {
      message: "Preparing...",
      quip: DDBMuncherLoader.randomQuip(),
    };
  }

  /** @inheritDoc */
  async _onRender(context: any, options: any) {
    await super._onRender(context, options);
    this.#startQuips();
  }

  /**
   * Advance the bar by one step and show what is being waited on.
   * @param {string} message  Text for the status row.
   */
  step(message: string): void {
    this.#current = Math.min(this.#current + 1, this.total);
    this.notifierV2({
      progress: { current: this.#current, total: this.total },
      message,
      section: "note",
      progressBar: "primary",
      suppress: true,
    });
  }

  /** Throw if the user has cancelled. Call between async steps. */
  checkCancelled(): void {
    if (this.cancelled) throw new DDBMuncherLoadCancelled();
  }

  /** Write a fresh quip to the quip row; a no-op once the dialog is gone. */
  showQuip(): void {
    if (!this.element) return;
    this.notifierV2({ section: "monster", message: DDBMuncherLoader.randomQuip(), suppress: true });
  }

  #startQuips(): void {
    this.#stopQuips();
    this.#quipInterval = setInterval(() => this.showQuip(), DDBMuncherLoader.QUIP_INTERVAL_MS);
  }

  #stopQuips(): void {
    if (this.#quipInterval === null) return;
    clearInterval(this.#quipInterval);
    this.#quipInterval = null;
  }

  static async cancel(this: DDBMuncherLoader, event?: Event) {
    event?.preventDefault();
    this.#controller.abort();
    await this.close();
  }

  /** @inheritDoc - closing the window by any route counts as a cancel */
  _onClose(options: any) {
    super._onClose(options);
    this.#stopQuips();
    this.#controller.abort();
  }

  /**
   * Render the dialog and hand it back once it is on screen.
   * @param {number} total  Number of steps the orchestration will report.
   */
  static async open(total: number): Promise<DDBMuncherLoader> {
    const loader = new this({ total });
    await loader.render({ force: true });
    return loader;
  }

}
