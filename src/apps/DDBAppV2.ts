import { DICTIONARY } from "../config/_module";
import {
  logger,
} from "../lib/_module";

import { DDBReferenceLinker } from "../parser/lib/_module";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export interface NotifierV1Props {
  nameField?: boolean;
  monsterNote?: boolean;
  isError?: boolean;
  message?: string;
}

export interface NotifierV2Props {
  progress?: {
    current: number;
    total: number;
  };
  section?: string;
  message: string;
  suppress?: boolean;
  isError?: boolean;
  clear?: boolean;
}


export default class DDBAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {

  notifier: (note: any, { nameField, monsterNote, isError, message }?: NotifierV1Props) => void;

  constructor() {
    super();
    this.notifier = this.munchNote;
  }

  /** @override */
  tabGroups = {};

  _markTabs(tabs) {
    for (const v of Object.values(tabs)) {
      v.active = this.tabGroups[v.group] === v.id;
      v.cssClass = v.active ? "active" : "";
      if ("tabs" in v) this._markTabs(v.tabs);
    }
    return tabs;
  }

  // override this

  _getTabs() {
    return {};
  }

  /**
   * Expanded states for additional settings sections.
   * @type {Map<string, boolean>}
   */
  #expandedSections = new Map();

  get expandedSections() {
    return this.#expandedSections;
  }

  _toggleNestedTabs() {
    const primary = this.element.querySelector('.window-content > [data-application-part="tabs"]');
    const active = this.element.querySelector('.tab.active[data-group="sheet"]');
    if (!primary || !active) return;
    primary.classList.toggle("nested-tabs", active.querySelector(`:scope > .sheet-tabs`));
  }

  /* -------------------------------------------- */
  /*  Life-Cycle Handlers                         */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _onRender(context, options) {
    super._onRender(context, options);
    // Allow multi-select tags to be removed when the whole tag is clicked.
    this.element.querySelectorAll("multi-select").forEach((select) => {
      if (select.disabled) return;
      select.querySelectorAll(".tag").forEach((tag) => {
        tag.classList.add("remove");
        tag.querySelector(":scope > span")?.classList.add("remove");
      });
    });

    // Add special styling for label-top hints.
    this.element.querySelectorAll(".label-top > p.hint").forEach((hint) => {
      const label = hint.parentElement.querySelector(":scope > label");
      if (!label) return;
      hint.ariaLabel = hint.innerText;
      hint.dataset.tooltip = hint.innerHTML;
      hint.innerHTML = "";
      label.insertAdjacentElement("beforeend", hint);
    });
    for (const element of this.element.querySelectorAll("[data-expand-id]")) {
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
  changeTab(tab, group, options) {
    super.changeTab(tab, group, options);
    if (["sheet"].includes(group)) {
      this._toggleNestedTabs();
    }
  }

  async _prepareContext(options) {
    const noCacheLoad = options?.noCacheLoad ?? false;
    if (!noCacheLoad) await DDBReferenceLinker.importCacheLoad();
    const context = foundry.utils.mergeObject(await super._prepareContext(options), {}, { inplace: false });
    context.tabs = this._getTabs();
    logger.debug("DDBAppV2: _prepareContext", context);
    return context;
  }

  /** @override */

  async _preparePartContext(_partId, context) {
    return context;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (options.isFirstRender && this.hasFrame) {
      options.window ||= {};
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    const containers = {};
    for (const [part, config] of Object.entries(this.constructor.PARTS)) {
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
  munchNote(note: string, { nameField = false, monsterNote = false, isError = false, message = null }: { nameField?: boolean; monsterNote?: boolean; isError?: boolean; message?: string; } = {}) {
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


  getMessageClass(section) {
    let messageClass;
    switch (section) {
      case "level3":
      case "note":
        messageClass = "munching-task-note";
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
    clear = false }: NotifierV2Props,
  ) {
    const builtMessage = progress ? `${progress.current}/${progress.total} : ${message}` : message;
    if (!suppress) logger.info(builtMessage);
    if (!this.element) {
      logger.info("PreRenderNote:", { progress, section, message, suppress, isError });
      return;
    }

    const importProgressElement = this.element.querySelector(".munching-progress");
    const barElement = this.element.querySelector(".munching-progress-bar") as HTMLElement;
    const messageClass = this.getMessageClass(section);

    const messageElement = this.element.querySelector(`#${messageClass}`) as HTMLElement;
    if (messageElement) {
      messageElement.textContent = builtMessage;
      messageElement.style.height = "auto";
    }

    if (progress && importProgressElement) {
      importProgressElement.classList.remove('munching-hidden');
      barElement.style.width = `${Math.trunc((progress.current / progress.total) * 100)}%`;

      if (clear && barElement) {
        // clear logic here
        importProgressElement.classList.add('munching-hidden');
      }
    }

  }

  intervalId = null;

  autoRotateMessage(category, subcategory = null, intervalMs = 5000) {
    if (this.intervalId) this.stopAutoRotateMessage();
    let messages;

    if (subcategory) {
      messages = DICTIONARY.messages.loading[category]?.[subcategory];
    } else {
      messages = DICTIONARY.messages.loading[category];
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
