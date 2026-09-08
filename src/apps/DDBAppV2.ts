import { DeepPartial } from "fvtt-types/utils";
import { DICTIONARY } from "../config/_module";
import logger from "../lib/Logger";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Naming the mixed base type stops subclasses re-inferring the mixin's return type: when tsserver
// checks a subclass file first, that inference resolves cold and drops every ApplicationV2 member
// (`element`, `render`, `close`...) from the base.
type TApplicationV2Brand = Pick<
  foundry.applications.api.ApplicationV2.Internal.Constructor,
  keyof foundry.applications.api.ApplicationV2.Internal.Constructor
>;
type TDDBAppV2BaseClass = typeof ApplicationV2 & TApplicationV2Brand;
const DDBAppV2Base: foundry.applications.api.HandlebarsApplicationMixin.Mix<TDDBAppV2BaseClass>
  = HandlebarsApplicationMixin(ApplicationV2 as TDDBAppV2BaseClass);

// Foundry's <multi-select> keeps its selection in `_value` and repaints its tags in `_refresh`;
// neither is part of the public element typing
type TMultiSelectInternals = HTMLElement & { _value: Set<string>; _refresh: () => void };

// the part state Foundry threads from _preSyncPartState to _syncPartState, plus the control values
// carried across a replacement here
type TDDBPartState = foundry.applications.api.HandlebarsApplicationMixin.PartState & {
  ddbControlValues?: Record<string, string[]>;
};

// tab contexts here are deep nested partials, wider than the base Tab record

/**
 * Thrown from `_preRender` to abandon a render that was scheduled behind setting writes. Foundry
 * awaits `_preRender` after the context is prepared but before it touches the DOM, and a rejection
 * there leaves the application exactly as it was, so the render can be re-run once the user is
 * idle again. Preparing the muncher's context takes long enough for the user to have reopened the
 * dropdown they had just chosen from, and a swap at that point closes it under them.
 */
class SettingRenderDeferred extends Error {}

// marks a render as one scheduled behind setting writes, so _preRender knows it may be deferred.
// Built per render: Foundry fills `parts` into the options object it is handed, so a shared object
// would carry one window's part list into the next window's render
type TSettingRenderOptions = DeepPartial<foundry.applications.api.Application.RenderOptions> & { ddbSettingRender?: boolean };
function settingRenderOptions(): TSettingRenderOptions {
  return { ddbSettingRender: true };
}

export default abstract class DDBAppV2 extends DDBAppV2Base<DDBAppV2Context> {

  static override get PARTS(): Record<string, DDBApplicationPart> {
    return super.PARTS;
  }

  // primary: current phase, secondary: current item, overall: the whole run
  static PROGRESS_BAR_SELECTORS: Record<string, string> = {
    primary: ".munching-progress-primary",
    secondary: ".munching-progress-secondary",
    overall: ".munching-progress-overall",
  };

  // every status row in handlebars/muncher/details.hbs
  static DETAIL_MESSAGE_IDS: string[] = [
    "munching-task-name",
    "munching-task-monster",
    "munching-task-notes",
    "munching-task-import",
    "munching-task-overall",
  ];

  notifier: NotifierV1;

  // subclasses pass app options for typing purposes; ApplicationV2 configuration
  // comes from static DEFAULT_OPTIONS, so they are not forwarded
  constructor(_options: Record<string, any> = {}) {
    super();
    this.notifier = this.munchNote;
  }

  /** @override */
  override tabGroups: Record<string, string> = {};

  _markTabs(tabs: IDDBTabs): IDDBTabs {
    for (const v of Object.values(tabs)) {
      v.active = v.group ? this.tabGroups[v.group] === v.id : false;
      v.cssClass = v.active ? "active" : "";
      if (v.tabs) this._markTabs(v.tabs as IDDBTabs);
    }
    return tabs;
  }

  // override this
  abstract _getTabs(): IDDBTabs;

  /**
   * Expanded states for additional settings sections.
   * @type {Map<string, boolean>}
   */
  #expandedSections = new Map();

  get expandedSections() {
    return this.#expandedSections;
  }

  _toggleNestedTabs() {
    const primary = this.element.querySelector(".window-content > [data-application-part=\"tabs\"]");
    const active = this.element.querySelector(".tab.active[data-group=\"sheet\"]");
    if (!primary || !active) return;
    primary.classList.toggle("nested-tabs", !!active.querySelector(`:scope > .sheet-tabs`));
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  protected settingUpdateChain: Promise<void> = Promise.resolve();

  protected pendingSettingUpdates = 0;

  // the most recently queued write per key, so superseded writes can be skipped
  protected latestSettingUpdates = new Map<string, symbol>();

  // the render scheduled behind the queue
  protected settingRenderPromise: Promise<void> | null = null;

  // pointer/keyboard quiet required in the app before a queued render runs, and how often the
  // parked render re-checks for it. A render replaces the part's DOM, so one landing between two
  // clicks hands the user a control rebuilt from a setting their later clicks have moved past.
  protected settingRenderIdleMs = 400;
  protected settingRenderPollMs = 100;
  protected lastInteractionAt = 0;

  // whether the last thing the user did in the app was commit a control (a change event) rather
  // than start using one (pointer or key). Choosing from a `<select>` fires change and closes the
  // popup but leaves focus on the select, so focus alone would hold the render until they click
  // elsewhere - the class list on the mule tab never gained its new class
  protected controlSettled = false;

  // set while a flush (a tab change) wants the parked render to land without waiting for quiet
  protected settingRenderFlushRequested = false;

  // the root the interaction listeners are attached to, replaced when the app is reopened
  protected interactionElement: HTMLElement | null = null;

  /**
   * Serialise an async setting write triggered by a UI control, re-rendering once the queue has
   * drained and the user has finished interacting.
   *
   * Tag removals on a `<multi-select>` fire their change events far faster than a settings write
   * plus a re-render round trip.
   * @param {() => Promise<void>} update  The setting write to perform.
   * @param {object} [options]
   * @param {string} [options.key]  Coalescing key, normally the setting name. A newer write with
   *                                the same key supersedes any queued write that has not run yet.
   * @param {boolean} [options.render=true]  Re-render once no further writes are queued.
   */
  protected async queueSettingUpdate(update: () => Promise<void>, { key = null, render = true }: {
    key?: string | null;
    render?: boolean;
  } = {}): Promise<void> {
    const token = Symbol(key ?? "setting-update");
    if (key) this.latestSettingUpdates.set(key, token);
    this.pendingSettingUpdates += 1;
    this.settingUpdateChain = this.settingUpdateChain.then(async () => {
      try {
        const superseded = key !== null && this.latestSettingUpdates.get(key) !== token;
        if (!superseded) await update();
      } catch (err) {
        logger.error("DDBAppV2: queued setting update failed", err);
      } finally {
        if (key !== null && this.latestSettingUpdates.get(key) === token) this.latestSettingUpdates.delete(key);
        this.pendingSettingUpdates -= 1;
      }
      // rendering now would rebuild the control from a value the later clicks have not reached yet
      if (render && this.pendingSettingUpdates === 0) this.scheduleSettingRender();
    });
    return this.settingUpdateChain;
  }

  /**
   * Resolve once every setting write queued so far has been applied. A munch button read its
   * settings at click time, so a category change made a moment earlier could still be in flight and
   * the import would run against the previous value. Waits for the writes only, never for the
   * follow-up render, which may be parked on the user indefinitely.
   */
  protected async awaitSettingUpdates(): Promise<void> {
    await this.settingUpdateChain;
  }

  /**
   * Is the user part way through using a control in this app? An open `<select>` popup keeps
   * focus on the select, so this also covers a dropdown the user has opened but not chosen from.
   */
  protected isUserEditingControl(): boolean {
    const root = this.element;
    if (!root?.isConnected) return false;
    const active = document.activeElement;
    if (!active || !root.contains(active)) return false;
    if (!active.closest("multi-select, string-tags, select, input, textarea")) return false;
    // a select that has fired change since it was last touched has its popup closed; the focus it
    // keeps is a browser artefact, not the user part way through a choice
    if (this.controlSettled && active.localName === "select") return false;
    return true;
  }

  /**
   * Note that the user just did something in this app. Clicking a `<multi-select>` tag focuses
   * nothing - the tag is a plain div - so focus alone cannot tell a burst of removals from a user
   * who has finished; the timestamp can.
   */
  protected trackInteractions(): void {
    if (this.interactionElement === this.element) return;
    this.interactionElement = this.element;
    const mark = (event: Event) => {
      this.lastInteractionAt = Date.now();
      // pointerup is the tail of a click that pointerdown already counted as starting one
      if (event.type !== "pointerup") this.controlSettled = event.type === "change";
    };
    for (const type of ["pointerdown", "pointerup", "keydown", "change"]) {
      this.element.addEventListener(type, mark, { capture: true });
    }
  }

  /** May a render queued behind a setting write run now, without disrupting the user? */
  protected canRunQueuedRender(): boolean {
    if (this.pendingSettingUpdates > 0) return false;
    if (this.settingRenderFlushRequested) return true;
    if (this.isUserEditingControl()) return false;
    return (Date.now() - this.lastInteractionAt) >= this.settingRenderIdleMs;
  }

  /**
   * Render once the queue has drained and the user has paused. Kept off the update chain so that
   * waiting on the user cannot hold up the writes their next clicks queue, and polled rather than
   * event driven because the wait ends on the absence of input rather than on any one event.
   */
  protected scheduleSettingRender(): Promise<void> {
    if (this.settingRenderPromise) return this.settingRenderPromise;
    const scheduled = (async () => {
      try {
        while (this.rendered) {
          while (this.rendered && !this.canRunQueuedRender()) {
            await new Promise<void>((resolve) => {
              setTimeout(resolve, this.settingRenderPollMs);
            });
          }
          if (!this.rendered) break;
          try {
            await this.render(settingRenderOptions());
            break;
          } catch (err) {
            if (!(err instanceof SettingRenderDeferred)) throw err;
            // the user picked up a control while the context was being prepared: wait them out again
          }
        }
      } catch (err) {
        logger.error("DDBAppV2: queued render failed", err);
      } finally {
        this.settingRenderPromise = null;
        this.settingRenderFlushRequested = false;
      }
    })();
    this.settingRenderPromise = scheduled;
    return scheduled;
  }

  /** @inheritDoc */
  override async _preRender(context: DeepPartial<foundry.applications.api.Application.RenderContext>, options: DeepPartial<foundry.applications.api.Application.RenderOptions>) {
    await super._preRender(context, options);
    // the idle check passed before the context was prepared; re-check now, at the last point a
    // render can still be abandoned without touching the DOM
    const deferrable = (options as TSettingRenderOptions).ddbSettingRender === true;
    if (deferrable && !this.canRunQueuedRender()) throw new SettingRenderDeferred("queued render deferred: the user is using a control");
  }

  /**
   * Apply every queued setting write and land the render parked behind them now, rather than
   * waiting for the user to go quiet. Used on a tab change: the user has moved on from the control
   * they were using, and the tab they are arriving at should show the settings they just chose.
   * Subclass guards that must hold the render regardless (a munch in progress) still apply.
   */
  protected async flushSettingUpdates(): Promise<void> {
    this.settingRenderFlushRequested = true;
    await this.awaitSettingUpdates();
    // nothing was scheduled behind the writes, so leave the next queued render its usual wait
    if (!this.settingRenderPromise) {
      this.settingRenderFlushRequested = false;
      return;
    }
    await this.settingRenderPromise;
  }

  /**
   * Build a selector that finds the same control again in freshly rendered markup.
   * @param {HTMLElement} element  A control in the part about to be replaced.
   */
  static controlSelector(element: HTMLElement): string | null {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const tag = element.localName;
    // the per-class subclass selects share a name, so the class id is what tells them apart
    if (element.dataset.classId) return `${tag}[data-class-id="${CSS.escape(element.dataset.classId)}"]`;
    const name = element.getAttribute("name");
    return name ? `${tag}[name="${CSS.escape(name)}"]` : null;
  }

  /** @inheritDoc */
  override _preSyncPartState(partId: string, newElement: HTMLElement, priorElement: HTMLElement, state: TDDBPartState) {
    super._preSyncPartState(partId, newElement, priorElement, state);
    // with writes still in flight the DOM holds clicks the setting has not caught up with, so the
    // new markup would put back a tag the user has already removed - and their next click would
    // then be computed from that resurrected value and write it straight back
    if (this.pendingSettingUpdates === 0) return;
    const values: Record<string, string[]> = {};
    for (const element of priorElement.querySelectorAll<HTMLElement>("multi-select")) {
      const selector = DDBAppV2.controlSelector(element);
      const value = (element as TMultiSelectInternals)._value;
      if (selector && value instanceof Set) values[selector] = Array.from(value);
    }
    state.ddbControlValues = values;
  }

  /** @inheritDoc */
  override _syncPartState(partId: string, newElement: HTMLElement, priorElement: HTMLElement, state: TDDBPartState) {
    super._syncPartState(partId, newElement, priorElement, state);
    for (const [selector, value] of Object.entries(state.ddbControlValues ?? {})) {
      const element = newElement.querySelector<HTMLElement>(selector) as TMultiSelectInternals | null;
      if (!element?._value) continue;
      // the render may have dropped options this control no longer offers
      const options = new Set(Array.from(element.querySelectorAll("option")).map((option) => option.value));
      // assigning `value` here would dispatch change and queue the same write a second time
      element._value = new Set(value.filter((id) => options.has(id)));
      element._refresh();
    }
  }

  static getMultiSelectValues(event: Event): string[] {
    const target = event.currentTarget as (EventTarget & { _value?: Set<string> | string[] }) | null;
    // Foundry's <multi-select> element stores its selection in `_value` (a Set).
    if (target?._value instanceof Set) return Array.from(target._value);
    if (target && Array.isArray(target._value)) return target._value;

    const select = event.currentTarget as HTMLSelectElement | null;
    return select?.selectedOptions ? Array.from(select.selectedOptions).map((o) => o.value) : [];
  }

  /** @inheritDoc */
  override async _onRender(context: DeepPartial<foundry.applications.api.Application.RenderContext>, options: foundry.applications.api.Application.RenderOptions) {
    await super._onRender(context, options);
    this.trackInteractions();
    // Allow multi-select tags to be removed when the whole tag is clicked.
    this.element.querySelectorAll<HTMLSelectElement>("multi-select").forEach((select) => {
      if (select.disabled) return;
      select.querySelectorAll(".tag").forEach((tag) => {
        tag.classList.add("remove");
        tag.querySelector(":scope > span")?.classList.add("remove");
      });
    });

    // Add special styling for label-top hints.
    this.element.querySelectorAll<HTMLElement>(".label-top > p.hint").forEach((hint) => {
      const label = hint.parentElement?.querySelector(":scope > label");
      if (!label) return;
      hint.ariaLabel = hint.innerText;
      hint.dataset.tooltip = hint.innerHTML;
      hint.innerHTML = "";
      label.insertAdjacentElement("beforeend", hint);
    });
    for (const element of this.element.querySelectorAll("[data-expand-id]") as NodeListOf<HTMLElement>) {
      element.querySelector(".collapsible")?.classList
        .toggle("collapsed", !this.#expandedSections.get(element.dataset.expandId));
    }

    // custom listeners
    this._toggleNestedTabs();
  }


  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritDoc */
  override changeTab(tab: any, group: any, options: any) {
    super.changeTab(tab, group, options);
    if (["sheet"].includes(group)) {
      this._toggleNestedTabs();
    }
    // Foundry's changeTab only swaps the active classes, so the render carrying any settings the
    // user changed on the tab they are leaving has to be asked for; changeTab is synchronous
    this.flushSettingUpdates().catch((err) => logger.error("DDBAppV2: flush on tab change failed", err));
  }

  override async _prepareContext(options: any): Promise<DDBAppV2Context> {
    const noCacheLoad = options?.noCacheLoad ?? false;
    if (!noCacheLoad) {
      // Keep the large parser/import graph out of lightweight browser applications that explicitly
      // skip cache loading. Loading it eagerly creates an apps -> parser -> apps module cycle.
      const DDBReferenceLinker = await import("../parser/lib/DDBReferenceLinker");
      await DDBReferenceLinker.importCacheLoad();
    }
    const context = foundry.utils.mergeObject(await super._prepareContext(options), {}, { inplace: false }) as DDBAppV2Context;
    context.tabs = this._getTabs() as Record<string, IDDBTab>;
    logger.debug("DDBAppV2: _prepareContext", context);
    return context;
  }

  /** @override */

  override async _preparePartContext(_partId: string, context: any) {
    return context;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  override _configureRenderOptions(options: any) {
    super._configureRenderOptions(options);
    if (options.isFirstRender && this.hasFrame) {
      options.window ||= {};
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  override async _onFirstRender(context: any, options: any) {
    await super._onFirstRender(context, options);
    const containers: Record<string, HTMLElement> = {};
    const ctor = this.constructor as typeof DDBAppV2;
    for (const [part, config] of Object.entries(ctor.PARTS)) {
      if (!config.container?.id) continue;
      const element = this.element.querySelector(`[data-application-part="${part}"]`);
      if (!element) continue;
      if (!containers[config.container.id]) {
        const div = document.createElement("div");
        div.dataset.containerId = config.container.id;
        div.classList.add(...config.container.classes ?? []);
        containers[config.container.id] = div;
        element.replaceWith(div);
      }
      containers[config.container.id].append(element);
    }
  }

  /**
   * Display information when Munching
   * @param {string} note
   * @param {{ nameField: boolean, monsterNote: boolean, isError: boolean, message: string }} [options]
   * @description
   * Updates the text content of the appropriate HTML element:
   *   - `#munching-task-name` if `options.nameField` is true
   *   - `#munching-task-monster` if `options.monsterNote` is true
   *   - `#munching-task-notes` otherwise
   */
  munchNote(note: string, { nameField = false, monsterNote = false, isError = false, message = null }: { nameField?: boolean; monsterNote?: boolean; isError?: boolean; message?: string | boolean | null } = {}) {
    if (!this.element) {
      logger.info("PreRenderNote:", { note, nameField, monsterNote, message, isError });
      return;
    }
    const taskName = this.element.querySelector("#munching-task-name") as HTMLElement;
    const taskMonster = this.element.querySelector("#munching-task-monster") as HTMLElement;
    const taskNotes = this.element.querySelector("#munching-task-notes") as HTMLElement;

    if (nameField) {
      taskName.textContent = note;
      taskMonster.style.height = "auto";
    } else if (monsterNote) {
      taskMonster.textContent = note;
      taskMonster.style.height = "auto";
    } else {
      taskNotes.textContent = note;
      taskMonster.style.height = "auto";
    }

    logger.debug(`Munching: ${note}`, { message, isError, monsterNote, nameField });
  }


  getMessageClass(section: any) {
    let messageClass;
    switch (section) {
      case "level4":
      case "import":
        messageClass = "munching-task-import";
        break;
      case "level5":
      case "overall":
        messageClass = "munching-task-overall";
        break;
      case "level3":
      case "note":
        messageClass = "munching-task-notes";
        break;
      case "level2":
      case "monster":
        messageClass = "munching-task-monster";
        break;
      case "level1":
      case "name":
        messageClass = "munching-task-name";
        break;
      // no default
    }
    return messageClass;
  }

  notifierV2({ progress, section = "note", message = "", suppress = false, isError = false,
    clear = false, progressBar = "primary" }: NotifierV2Props,
  ) {
    const builtMessage = progress ? `${progress.current}/${progress.total} : ${message}` : message;
    if (!suppress) logger.info(builtMessage);
    if (!this.element) {
      logger.info("PreRenderNote:", { progress, section, message, suppress, isError });
      return;
    }

    const barSelector = DDBAppV2.PROGRESS_BAR_SELECTORS[progressBar] ?? DDBAppV2.PROGRESS_BAR_SELECTORS.primary;
    const importProgressElement = this.element.querySelector(barSelector) as HTMLElement | null;
    const barElement = importProgressElement?.querySelector(".munching-progress-bar") as HTMLElement | null;
    const messageClass = this.getMessageClass(section);

    const messageElement = this.element.querySelector(`#${messageClass}`) as HTMLElement;
    if (messageElement) {
      messageElement.textContent = builtMessage;
      messageElement.style.height = "auto";
    }

    if (progress && importProgressElement && barElement) {
      importProgressElement.classList.remove("munching-hidden");
      const pct = progress.total > 0 ? Math.trunc((progress.current / progress.total) * 100) : 0;
      barElement.style.width = `${pct}%`;

      if (clear) {
        importProgressElement.classList.add("munching-hidden");
      }
    }

  }

  /**
   * Hides every progress bar in the import details pane and resets it to zero,
   * so a finished run does not leave a stale bar behind for the next one.
   */
  clearProgressBars() {
    if (!this.element) return;
    this.element.querySelectorAll<HTMLElement>(".munching-progress").forEach((progressElement) => {
      progressElement.classList.add("munching-hidden");
      const bar = progressElement.querySelector(".munching-progress-bar") as HTMLElement | null;
      if (bar) bar.style.width = "0%";
    });
    // this row only captions the overall bar, so it goes with it
    const overallMessage = this.element.querySelector("#munching-task-overall") as HTMLElement | null;
    if (overallMessage) overallMessage.textContent = "";
  }

  /**
   * Blank every status row in the import details pane and reset the bars, so a finished or
   * dismissed run leaves nothing behind for the next one to show before it writes its own text.
   */
  clearDetails() {
    if (!this.element) return;
    for (const id of DDBAppV2.DETAIL_MESSAGE_IDS) {
      const row = this.element.querySelector(`#${id}`) as HTMLElement | null;
      if (row) row.textContent = "";
    }
    this.clearProgressBars();
  }

  intervalId: any = null;

  autoRotateMessage(category: keyof typeof DICTIONARY.messages.loading, subcategory: string | null = null, intervalMs = 5000) {
    if (this.intervalId) this.stopAutoRotateMessage();
    let messages: string[] | undefined;

    const categoryMessages = DICTIONARY.messages.loading[category];
    if (subcategory) {
      messages = Array.isArray(categoryMessages) ? undefined : categoryMessages?.[subcategory];
    } else if (Array.isArray(categoryMessages)) {
      messages = categoryMessages;
    }
    if (!messages || !messages.length) {
      messages = DICTIONARY.messages.loading["default"];
    }

    this.notifierV2({
      section: "level2",
      message: "This is going to take a significant amount of time...",
      suppress: true,
    });

    // Rotate messages at interval
    const intervalId = setInterval(() => {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      this.notifierV2({
        section: "level2",
        message: randomMessage,
        suppress: true,
      });
    }, intervalMs);

    // Return interval ID so you can stop it later
    this.intervalId = intervalId;
    return intervalId;
  }

  stopAutoRotateMessage() {
    logger.debug("Stopping auto rotate message");
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    logger.info("Stopped auto rotate message");
    this.notifierV2({ section: "level2", message: "", suppress: true, clear: true });
    this.intervalId = null;
  }

}
