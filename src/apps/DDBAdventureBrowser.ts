import DDBAppV2 from "./DDBAppV2";
import { logger, utils, DDBSources, Secrets } from "../lib/_module";
import { SETTINGS } from "../config/_module";
import DDBAdventures from "../muncher/DDBAdventures";
import NativeAdventureMunch from "../muncher/adventure/native/NativeAdventureMunch";

/**
 * Browse the user's DDB adventures grouped by source category and import them
 * via the native (in-browser) importer. The catalog comes from CONFIG.DDB
 * (already client-side) so there's no per-source fetch - the only network call
 * is the owned-content lookup, used to badge which books the user owns.
 */
export default class DDBAdventureBrowser extends DDBAppV2 {

  expandedCategories = new Set<number>();
  searchTerm = "";
  importingId: number | null = null;
  // View filter: hide books the user doesn't own. Only effective once the
  // owned-content lookup succeeds; defaults on.
  hideUnowned = true;

  // Owned book ids: null until fetched (or when the lookup fails). A failed
  // lookup sets _ownedFetchFailed and leaves _ownedIds null - the list then
  // shows every book with no ownership marks.
  private _ownedIds: number[] | null = null;
  private _ownedFetchInFlight = false;
  private _ownedFetchFailed = false;
  private _searchDebounce: ((...args: any[]) => void) | null = null;
  private _searchCaret: { start: number; end: number } | null = null;
  // Preserve list scroll across re-renders (toggling a category re-renders the
  // whole part, which otherwise resets scrollTop to 0).
  private _scrollTop = 0;

  static DEFAULT_OPTIONS = {
    id: "ddb-native-adventure-browser",
    classes: ["dnd5e2", "ddb-adventure-browser"],
    window: {
      title: "DDB Adventure Browser: Special Edition",
      icon: "fas fa-book-open",
      resizable: true,
      minimizable: true,
    },
    actions: {
      reloadOwned: DDBAdventureBrowser.reloadOwned,
      toggleCategory: DDBAdventureBrowser.toggleCategory,
      importAdventure: DDBAdventureBrowser.importAdventure,
      closeDetails: DDBAdventureBrowser.closeDetails,
      close: DDBAdventureBrowser.cancel,
    },
    position: { width: 900, height: 760 },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/adventure-browser/browser.hbs",
    },
    // Re-uses the muncher's import-details overlay (modal + dual progress bars +
    // spinner + Okay button) verbatim; the bar/status ids it contains are what
    // notifierV2 writes to.
    details: {
      template: "modules/ddb-importer/handlebars/muncher/details.hbs",
    },
  };

  _getTabs(): IDDBTabs {
    return {};
  }

  static async reloadOwned(this: DDBAdventureBrowser, _event, _target) {
    this._ownedIds = null;
    this._ownedFetchFailed = false;
    await this._loadOwned();
  }

  static toggleCategory(this: DDBAdventureBrowser, _event, target) {
    const categoryId = Number(target?.dataset?.categoryId);
    if (!Number.isInteger(categoryId)) return;
    if (this.expandedCategories.has(categoryId)) this.expandedCategories.delete(categoryId);
    else this.expandedCategories.add(categoryId);
    this.render();
  }

  static async importAdventure(this: DDBAdventureBrowser, _event, target) {
    const bookId = Number(target?.dataset?.bookId);
    if (!Number.isInteger(bookId)) {
      logger.error("DDBAdventureBrowser.importAdventure: missing/invalid bookId on target");
      return;
    }
    if (this.importingId) {
      ui.notifications.warn("An adventure import is already running.");
      return;
    }
    const bookName = CONFIG.DDB.sources.find((s) => s.id === bookId)?.description ?? `book ${bookId}`;
    // No re-render here: the overlay parts are toggled via the DOM so the
    // progress bars survive (a render would rebuild them at 0%).
    this.importingId = bookId;
    this._setBusy(bookName);
    const notifier = this.notifierV2.bind(this);
    try {
      // Each option falls back to its adventure-policy setting inside the
      // muncher, but the UI surfaces them so we pass them explicitly.
      const options = {
        allScenes: utils.getSetting<boolean>("adventure-policy-all-scenes"),
        compendiumOnly: utils.getSetting<boolean>("adventure-policy-compendium-only"),
        addToCompendiums: utils.getSetting<boolean>("adventure-policy-add-to-compendiums"),
        importAllMonsters: utils.getSetting<boolean>("adventure-policy-all-actors-into-world"),
      };
      await new NativeAdventureMunch({ notifier }).importBook(bookId, options);
      this.notifierV2({ section: "monster", message: `Imported ${bookName}`, clear: true });
      this.notifierV2({ section: "import", message: "", clear: true, progressBar: "secondary" });
    } catch (error) {
      logger.error("DDBAdventureBrowser: adventure import failed", error);
      this.notifierV2({ section: "monster", message: `Import failed: ${(error as Error).message}`, isError: true });
    } finally {
      this._setDone();
    }
  }

  static async closeDetails(this: DDBAdventureBrowser, _event, _target) {
    const details = this.element.querySelector(".ddb-muncher-details");
    if (details) details.classList.add("munching-details-hidden");
    this.importingId = null;
    await this.render();
  }

  // Show the modal overlay + spinner, disable action buttons, reset status rows
  // and both progress bars. DOM-only (no render) so notifierV2 writes survive.
  _setBusy(bookName: string) {
    const el = this.element;
    if (!el) return;
    el.querySelector(".ddb-muncher-details")?.classList.remove("munching-details-hidden");
    el.querySelector(".ddb-overlay")?.classList.remove("munching-invalid");
    el.querySelector(".ddb-working")?.classList.remove("munching-hidden");
    el.querySelector("#munch-details-okay")?.classList.add("munching-hidden");
    el.querySelectorAll<HTMLButtonElement>(
      "button[data-action=\"importAdventure\"], button[data-action=\"reloadOwned\"]",
    ).forEach((b) => {
      b.disabled = true;
    });

    // reset status rows + bars
    this.notifierV2({ section: "name", message: bookName });
    this.notifierV2({ section: "monster", message: "Starting import..." });
    this.notifierV2({ section: "import", message: "", clear: true, progressBar: "secondary" });
    el.querySelectorAll<HTMLElement>(".munching-progress").forEach((p) => {
      p.classList.add("munching-hidden");
      const bar = p.querySelector(".munching-progress-bar") as HTMLElement | null;
      if (bar) bar.style.width = "0%";
    });
  }

  // Stop the spinner and reveal the Okay button; leave the overlay up so the
  // final status/result is readable. closeDetails dismisses it.
  _setDone() {
    const el = this.element;
    if (!el) return;
    el.querySelector(".ddb-working")?.classList.add("munching-hidden");
    // Re-hide the click-catching overlay so the Okay button is clickable again.
    el.querySelector(".ddb-overlay")?.classList.add("munching-invalid");
    el.querySelector("#munch-details-okay")?.classList.remove("munching-hidden");
  }

  static async cancel(this: DDBAdventureBrowser) {
    await this.close();
  }

  async _loadOwned() {
    if (this._ownedFetchInFlight) return;
    this._ownedFetchInFlight = true;
    await this.render();
    try {
      const cobalt = Secrets.getCobalt();
      if (!cobalt) {
        this._ownedFetchFailed = true;
        this._ownedIds = null;
        return;
      }
      const ids = await DDBAdventures.fetchOwnedBookIds();
      if (ids === null) {
        this._ownedFetchFailed = true;
        this._ownedIds = null;
      } else {
        this._ownedIds = ids;
        this._ownedFetchFailed = false;
      }
    } catch (error) {
      logger.warn(`DDBAdventureBrowser: owned fetch failed: ${(error as Error).message ?? error}`);
      this._ownedFetchFailed = true;
      this._ownedIds = null;
    } finally {
      this._ownedFetchInFlight = false;
      await this.render();
    }
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    if (this._ownedIds === null && !this._ownedFetchFailed) {
      this._loadOwned();
    }
  }

  // Settings setters - mirror DDBMapBrowser: write the world setting, re-render.
  async _setAllScenes(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-all-scenes", checked);
    await this.render();
  }

  async _setAllActors(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-all-actors-into-world", checked);
    await this.render();
  }

  async _setAddToCompendiums(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-add-to-compendiums", checked);
    await this.render();
  }

  async _setCompendiumOnly(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-compendium-only", checked);
    await this.render();
  }

  async _set2024Monsters(checked: boolean) {
    await game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-use2024-monsters", checked);
    await this.render();
  }

  _setHideUnowned(checked: boolean) {
    this.hideUnowned = checked;
    this.render();
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    // Restore list scroll position, then keep tracking it.
    const body = this.element.querySelector(".ddb-adventure-browser-body") as HTMLElement | null;
    if (body) {
      body.scrollTop = this._scrollTop;
      body.addEventListener("scroll", () => {
        this._scrollTop = body.scrollTop;
      });
    }

    const wire = (selector: string, handler: (checked: boolean) => void) => {
      this.element.querySelectorAll<HTMLInputElement>(selector).forEach((cb) => {
        cb.addEventListener("change", (event) => {
          handler((event.currentTarget as HTMLInputElement).checked);
        });
      });
    };
    wire(".adv-opt-all-scenes", (c) => this._setAllScenes(c));
    wire(".adv-opt-all-actors", (c) => this._setAllActors(c));
    wire(".adv-opt-add-compendiums", (c) => this._setAddToCompendiums(c));
    wire(".adv-opt-compendium-only", (c) => this._setCompendiumOnly(c));
    wire(".adv-opt-2024-monsters", (c) => this._set2024Monsters(c));
    wire(".adv-opt-hide-unowned", (c) => this._setHideUnowned(c));

    const input = this.element.querySelector("#adventure-browser-search") as HTMLInputElement | null;
    if (!input) return;

    if (this._searchCaret) {
      input.focus();
      const { start, end } = this._searchCaret;
      try {
        input.setSelectionRange(start, end);
      } catch (_e) { /* ignore unsupported */ }
      this._searchCaret = null;
    }

    if (!this._searchDebounce) {
      this._searchDebounce = foundry.utils.debounce(() => this.render(), 200);
    }

    input.addEventListener("input", (event: any) => {
      const el = event.target as HTMLInputElement;
      this.searchTerm = el.value ?? "";
      this._searchCaret = {
        start: el.selectionStart ?? this.searchTerm.length,
        end: el.selectionEnd ?? this.searchTerm.length,
      };
      this._searchDebounce!();
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext({ ...options, noCacheLoad: true }) as any;

    context.searchTerm = this.searchTerm;
    context.loadingOwned = this._ownedFetchInFlight;
    context.ownershipUnavailable = this._ownedFetchFailed;
    context.ownershipKnown = !!(this._ownedIds && !this._ownedFetchFailed);
    context.hideUnowned = this.hideUnowned;

    context.allScenes = utils.getSetting<boolean>("adventure-policy-all-scenes");
    context.allActorsToWorld = utils.getSetting<boolean>("adventure-policy-all-actors-into-world");
    context.addToCompendiums = utils.getSetting<boolean>("adventure-policy-add-to-compendiums");
    context.compendiumOnly = utils.getSetting<boolean>("adventure-policy-compendium-only");
    context.use2024Monsters = utils.getSetting<boolean>("adventure-policy-use2024-monsters");

    const groups = this._buildCategoryGroups();
    context.categories = groups;
    context.totalAdventures = groups.reduce((acc, g) => acc + g.adventures.length, 0);
    return context;
  }

  _buildCategoryGroups() {
    const search = this.searchTerm.trim().toLowerCase();
    // owned===null => ownership unknown (no cobalt / lookup failed): show every
    // book with no marks. Otherwise badge anything not in the owned set.
    const owned = (this._ownedIds && !this._ownedFetchFailed)
      ? new Set(this._ownedIds)
      : null;

    const matchesSearch = (book: IDDBConfigSource) => {
      if (!search) return true;
      return (book.description ?? "").toLowerCase().includes(search)
        || (book.name ?? "").toLowerCase().includes(search);
    };

    return DDBSources.getDisplaySourceCategories()
      .map((cat) => {
        const books = DDBSources.getBooksInCategories([cat.id])
          .filter((b) => b.isReleased)
          // hide unowned only when we have a confirmed owned set and the toggle is on
          .filter((b) => !(owned && this.hideUnowned) || owned.has(b.id))
          .filter(matchesSearch);
        const adventures = books
          .map((b) => {
            const isOwned = owned === null ? null : owned.has(b.id);
            return {
              id: b.id,
              name: b.description,
              code: b.name,
              cover: b.avatarURL || null,
              importing: this.importingId === b.id,
              owned: isOwned,
              notOwned: isOwned === false,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        return {
          id: cat.id,
          name: cat.name,
          expanded: this.expandedCategories.has(cat.id) || !!search,
          count: adventures.length,
          adventures,
        };
      })
      .filter((g) => g.adventures.length)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

}
