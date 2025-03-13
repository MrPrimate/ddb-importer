import {
  logger,
} from "../lib/_module.mjs";

import { DDBReferenceLinker } from "../parser/lib/_module.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DDBAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {

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
  // eslint-disable-next-line class-methods-use-this
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
    await DDBReferenceLinker.importCacheLoad();
    const context = foundry.utils.mergeObject(await super._prepareContext(options), {}, { inplace: false });
    context.tabs = this._getTabs();
    logger.debug("DDBAppV2: _prepareContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
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
   * @param {{ nameField: boolean, monsterNote: boolean }} [options]
   * @description
   * Updates the text content of the appropriate HTML element:
   *   - `#munching-task-name` if `options.nameField` is true
   *   - `#munching-task-monster` if `options.monsterNote` is true
   *   - `#munching-task-notes` otherwise
   */
  munchNote(note, { nameField = false, monsterNote = false, isError = false, message = null } = {}) {
    const taskName = this.element.querySelector("#munching-task-name");
    const taskMonster = this.element.querySelector("#munching-task-monster");
    const taskNotes = this.element.querySelector("#munching-task-notes");

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


}

