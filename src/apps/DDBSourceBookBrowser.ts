import DDBAppV2 from "./DDBAppV2";
import DDBSources from "../lib/DDBSources";
import DDBProxyCache from "../lib/DDBProxyCache";
import DDBProxyCacheSettings from "../lib/DDBProxyCacheSettings";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]!,
  );
}

interface ISourceBookBrowserBook extends IMuncherSourceBook {
  selected: boolean;
}

interface ISourceBookBrowserCategory extends Omit<IMuncherSourceCategoryBooks, "books"> {
  books: ISourceBookBrowserBook[];
  count: number;
  expanded: boolean;
  selected: boolean;
}

interface ISourceBookBrowserContext extends DDBAppV2Context {
  searchTerm: string;
  categories: ISourceBookBrowserCategory[];
  cache?: ISourceBookBrowserCacheContext;
}

interface IDDBSourceBookBrowserOptions {
  /**
   * Runs a settings write from this window on the opening application's update queue, so both
   * windows order their writes together and a munch started right afterwards waits for them.
   * `key` coalesces superseded writes and defaults to the category setting. Returns false when
   * that application has gone away, leaving the browser to fall back to its own queue.
   */
  queueCategoryUpdate?: (update: () => Promise<void>, key?: string) => Promise<boolean>;
}

/**
 * Display order and heading for each proxy cache domain. The future display pass extends this
 * table rather than the template.
 */
export const CACHE_DOMAIN_LABELS: { domain: TProxyCacheDomain; label: string }[] = [
  { domain: "spells", label: "Spells" },
  { domain: "items", label: "Items" },
  { domain: "monsters", label: "Monsters" },
  { domain: "monster-id", label: "Monsters by id" },
  { domain: "vehicles", label: "Vehicles" },
  { domain: "mule-list", label: "Class, feat, background and species lists" },
  { domain: "subclasses", label: "Subclasses" },
  { domain: "mule-stream", label: "Class, feat, background and species munches" },
];

function asText(value: unknown, fallback = "?"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

/** The sources a search covered are shown on the detail line; the label carries only the search itself. */
function searchDescription(params: Record<string, unknown>, noun: string): string {
  const term = typeof params.search === "string" ? params.search.trim() : "";
  const parts = [term ? `search "${term}"` : "all"];
  // exact match only changes anything when there is a term to match
  if (term && params.exactMatch) parts.push("exact match");
  if (params.excludeLegacy) parts.push("no legacy");
  return `${noun}: ${parts.join(", ")}`;
}

/**
 * One-line, human description of a cached request
 */
export function describeCacheEntry(domain: TProxyCacheDomain, params: Record<string, unknown>, label?: string): string {
  switch (domain) {
    case "spells":
      return `Spells: ${asText(params.className)} (${asText(params.rulesVersion, "2014")})`;
    case "items": {
      const campaign = params.campaignId ? ` (campaign ${params.campaignId})` : "";
      return `Items: full catalogue${campaign}`;
    }
    case "monsters":
      return searchDescription(params, "Monsters");
    case "vehicles":
      return searchDescription(params, "Vehicles");
    case "monster-id":
      return `Monster id ${asText(params.id)}`;
    case "mule-list":
      return `${asText(params.type)} list`;
    case "subclasses":
      return `Subclasses: ${asText(params.className)} (${asText(params.rulesVersion, "2024")})`;
    case "mule-stream": {
      // systemRules is the world's rules version; a modern world importing 2014 classes sends
      // systemRules 2024 with include2014Adjusted off, so the rules alone would mislabel that run
      const rules = asText(params.systemRules, "2014") === "2024" && params.include2014Adjusted === false
        ? "2024 rules, 2014 content"
        : asText(params.systemRules, "2014");
      if (label) return `${label} (${rules})`;
      // entries written before labels were stored, or a stream that never named its class
      const element = asText(params.element);
      const target = params.classId ? ` class ${params.classId}` : (params.backgroundId ? ` background ${params.backgroundId}` : "");
      return `Munch: ${element}${target} (${rules})`;
    }
    default:
      return `${domain}`;
  }
}

function formatTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(ms);
  } catch (_err) {
    return new Date(ms).toISOString();
  }
}

/**
 * Group live entries by domain in display order. Monster by-id records are collapsed into one
 * aggregate row: a single spell munch can leave thousands of them.
 */
export function buildCacheGroups(
  entries: IProxyCacheEntry[],
  evaluate: typeof DDBProxyCacheSettings.evaluate = DDBProxyCacheSettings.evaluate,
): ISourceBookBrowserCacheGroup[] {
  const groups: ISourceBookBrowserCacheGroup[] = [];
  for (const { domain, label } of CACHE_DOMAIN_LABELS) {
    const matching = entries
      .filter((entry) => entry.domain === domain)
      .sort((a, b) => b.createdAt - a.createdAt);
    if (matching.length === 0) continue;
    if (domain === "monster-id") {
      const newest = Math.max(...matching.map((entry) => entry.createdAt));
      const soonest = Math.min(...matching.map((entry) => entry.expiresAt));
      groups.push({
        domain,
        label,
        count: matching.length,
        rows: [{
          label: `Monsters by id: ${matching.length} record${matching.length === 1 ? "" : "s"}`,
          detail: null,
          cachedAt: formatTime(newest),
          expiresAt: formatTime(soonest),
          matchesSettings: false,
          adoptable: false,
          differences: "",
        }],
      });
      continue;
    }
    groups.push({
      domain,
      label,
      count: matching.length,
      rows: matching.map((entry) => {
        const match = evaluate(domain, entry.params, entry.sourceSelection);
        return {
          key: entry.key,
          label: describeCacheEntry(domain, entry.params, entry.label),
          detail: DDBProxyCacheSettings.describeSources(domain, entry.params),
          cachedAt: formatTime(entry.createdAt),
          expiresAt: formatTime(entry.expiresAt),
          matchesSettings: match.supported && match.matches,
          adoptable: match.adoptable,
          differences: match.differences.join("\n"),
        };
      }),
    });
  }
  return groups;
}

/**
 * Sources and Cache window: a catalog of released DDB source books grouped by the categories DDB
 * assigns them to, plus management of the local proxy response cache.
 */
export default class DDBSourceBookBrowser extends DDBAppV2 {

  expandedCategories = new Set<number>();
  searchTerm = "";

  private _queueCategoryUpdate: ((update: () => Promise<void>, key?: string) => Promise<boolean>) | null;
  private _searchDebounce: (() => void) | null = null;
  private _searchCaret: { start: number; end: number } | null = null;
  private _scrollTop = 0;

  constructor({ queueCategoryUpdate }: IDDBSourceBookBrowserOptions = {}) {
    super();
    this._queueCategoryUpdate = queueCategoryUpdate ?? null;
  }

  /**
   * Bring an open browser to the front rather than rendering a second one into the same window id:
   * the repeat render replaces the existing DOM, dropping the expanded categories and search term
   * with it and orphaning the first instance unclosed.
   */
  static async open(options: IDDBSourceBookBrowserOptions = {}): Promise<DDBSourceBookBrowser> {
    const existing = foundry.applications.instances.get(DDBSourceBookBrowser.DEFAULT_OPTIONS.id);
    if (existing instanceof DDBSourceBookBrowser && existing.rendered) {
      // the newest opener owns the queue: whoever asked for the window last is the live one
      if (options.queueCategoryUpdate) existing._queueCategoryUpdate = options.queueCategoryUpdate;
      existing.bringToFront();
      return existing;
    }
    const browser = new DDBSourceBookBrowser(options);
    await browser.render({ force: true });
    return browser;
  }

  static override DEFAULT_OPTIONS = {
    id: "ddb-source-book-browser",
    classes: ["dnd5e2", "ddb-source-book-browser"],
    window: {
      title: "Sources and Cache",
      icon: "fas fa-book-open",
      resizable: true,
      minimizable: true,
    },
    actions: {
      selectBook: DDBSourceBookBrowser.selectBook,
      selectCategory: DDBSourceBookBrowser.selectCategory,
      toggleCategory: DDBSourceBookBrowser.toggleCategory,
      clearProxyCache: DDBSourceBookBrowser.clearProxyCache,
      clearCacheDomain: DDBSourceBookBrowser.clearCacheDomain,
      deleteCacheEntry: DDBSourceBookBrowser.deleteCacheEntry,
      adoptCacheSettings: DDBSourceBookBrowser.adoptCacheSettings,
    },
    position: { width: 900, height: 720 },
  };

  static override PARTS = {
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    sources: {
      template: "modules/ddb-importer/handlebars/source-book-browser/sources.hbs",
    },
    cache: {
      template: "modules/ddb-importer/handlebars/source-book-browser/cache.hbs",
    },
  };

  override tabGroups: Record<string, string> = {
    sheet: "sources",
  };

  _getTabs(): IDDBTabs {
    return this._markTabs({
      sources: {
        id: "sources", group: "sheet", label: "Source Selection", icon: "fas fa-book-open",
      },
      cache: {
        id: "cache", group: "sheet", label: "Cache Management", icon: "fas fa-database",
      },
    });
  }

  static toggleCategory(this: DDBSourceBookBrowser, _event: Event, target: HTMLElement): void {
    const categoryId = Number(target.dataset.categoryId);
    if (!Number.isInteger(categoryId)) return;
    if (this.expandedCategories.has(categoryId)) this.expandedCategories.delete(categoryId);
    else this.expandedCategories.add(categoryId);
    this.render();
  }

  static async selectCategory(this: DDBSourceBookBrowser, _event: Event, target: HTMLElement): Promise<void> {
    const categoryId = Number(target.dataset.categoryId);
    if (!Number.isInteger(categoryId)) return;
    await this._confirmCategorySelection(categoryId);
  }

  /**
   * A book inherits the selection state of its category. Confirm before changing that category so
   * the user is not surprised that every book in the group is affected.
   */
  static async selectBook(this: DDBSourceBookBrowser, _event: Event, target: HTMLElement): Promise<void> {
    const categoryId = Number(target.dataset.categoryId);
    const bookId = Number(target.dataset.bookId);
    if (!Number.isInteger(categoryId) || !Number.isInteger(bookId)) return;

    await this._confirmCategorySelection(categoryId, bookId);
  }

  /**
   * Confirm, then empty the proxy cache and the in-memory caches layered in front of it, so the
   * next munch of every type downloads fresh data.
   */
  static async clearProxyCache(this: DDBSourceBookBrowser, _event: Event, _target: HTMLElement): Promise<void> {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: { title: "Clear Cache" },
      content: `<p>Delete every cached D&amp;D Beyond download?</p>
        <p>The next munch of each type will download its data again.</p>`,
      yes: { label: "Clear Cache" },
    });
    if (!confirmed) return;

    await DDBProxyCache.clear();
    ui.notifications.info("DDB Importer proxy cache cleared.");
    await this.render();
  }

  /** Expire every entry of one domain (the group heading's button), after confirmation. */
  static async clearCacheDomain(this: DDBSourceBookBrowser, _event: Event, target: HTMLElement): Promise<void> {
    const domain = target.dataset.domain as TProxyCacheDomain | undefined;
    const group = CACHE_DOMAIN_LABELS.find((entry) => entry.domain === domain);
    if (!domain || !group) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: { title: `Clear Cache: ${group.label}` },
      content: `<p>Delete every cached <strong>${escapeHtml(group.label)}</strong> download? The next munch will download it again.</p>`,
      yes: { label: "Clear" },
    });
    if (!confirmed) return;

    // clear() also drops the in-memory caches registered for the domain
    await DDBProxyCache.clear(domain);
    await this.render();
  }

  /**
   * Rewrite the muncher settings so the next munch produces a listed entry's request. The writes
   * go through the opening muncher's queue (when it is open) so a munch clicked straight afterwards
   * waits for them, and its queued re-render refreshes the source preview once any running munch
   * has finished. The muncher is looked up by id because importing it here would be circular.
   */
  static async adoptCacheSettings(this: DDBSourceBookBrowser, _event: Event, target: HTMLElement): Promise<void> {
    const key = target.dataset.key;
    if (!key) return;
    const entry = (await DDBProxyCache.list()).find((candidate) => candidate.key === key);
    if (!entry) {
      ui.notifications.warn("That cache entry has gone; nothing was changed.");
      await this.render();
      return;
    }
    if (DDBProxyCacheSettings.isMuleDomain(entry.domain)) return;

    const muncher = foundry.applications.instances.get("ddb-importer-monsters") as {
      rendered?: boolean;
      searchTermMonster?: string;
    } | undefined;
    if (muncher?.rendered) {
      // the term is part of the request, so fill the tab's search box in as well (monsters and
      // vehicles share one box); the queued render writes it into the input
      const term = DDBProxyCacheSettings.searchTermOf(entry.domain, entry.params);
      if (term !== null) muncher.searchTermMonster = term;
    }

    let applied = false;
    const update = async () => {
      applied = await DDBProxyCacheSettings.adopt(entry.domain, entry.params);
    };
    if (!(await this._queueCategoryUpdate?.(update, "proxy-cache-adopt"))) {
      await this.queueSettingUpdate(update, { key: "proxy-cache-adopt", render: false });
    }
    if (!applied) return;
    ui.notifications.info(`Muncher settings updated to match "${describeCacheEntry(entry.domain, entry.params, entry.label)}".`);
    await this.render();
  }

  /** Expire one entry (a row's button). Cheap to re-download, so no confirmation. */
  static async deleteCacheEntry(this: DDBSourceBookBrowser, _event: Event, target: HTMLElement): Promise<void> {
    const key = target.dataset.key;
    if (!key) return;
    await DDBProxyCache.deleteKeys([key]);
    await this.render();
  }

  /**
   * Confirm category-level selection changes from either a category checkbox or one of its books.
   */
  private async _confirmCategorySelection(categoryId: number, bookId: number | null = null): Promise<void> {
    const category = DDBSources.getDisplaySourceCategories().find((entry) => entry.id === categoryId);
    const book = bookId === null
      ? null
      : CONFIG.DDB.sources.find((entry) => entry.id === bookId && entry.sourceCategoryId === categoryId);
    if (!category || (bookId !== null && !book)) return;

    const currentlyIncluded = DDBSources.getIncludedCategoryIds().includes(categoryId);
    const action = currentlyIncluded ? "remove" : "add";
    const actionLabel = currentlyIncluded ? "Remove Category" : "Add Category";
    const categoryName = escapeHtml(category.name);
    const context = book
      ? `<p><strong>${escapeHtml(book.description || book.name)}</strong> belongs to the <strong>${categoryName}</strong> category.</p>`
      : `<p>The <strong>${categoryName}</strong> category is ${currentlyIncluded ? "currently selected" : "not currently selected"}.</p>`;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      rejectClose: false,
      window: { title: `${actionLabel}: ${category.name}` },
      content: `${context}
        <p>Do you want to ${action} this category ${currentlyIncluded ? "from" : "to"} the source selection? This affects every book in the category.</p>`,
      yes: { label: actionLabel },
    });
    if (!confirmed) return;

    await this._updateCategorySelection(categoryId, !currentlyIncluded);
    await this.render();
  }

  /**
   * Use the owning muncher's queue when opened from it. The fallback keeps the browser safe when
   * that muncher has closed, or when it is instantiated independently in tests or by internal
   * callers. The current ids are read inside the write rather than captured, so a change made in
   * the other window between the click and the write is preserved.
   */
  private async _updateCategorySelection(categoryId: number, include: boolean): Promise<void> {
    const update = async () => {
      const includedCategoryIds = DDBSources.getIncludedCategoryIds();
      const updatedCategoryIds = include
        ? Array.from(new Set([...includedCategoryIds, categoryId]))
        : includedCategoryIds.filter((id) => id !== categoryId);
      await DDBSources.updateIncludedCategories(updatedCategoryIds);
    };

    if (await this._queueCategoryUpdate?.(update)) return;

    await this.queueSettingUpdate(update, {
      key: "munching-policy-muncher-included-source-categories",
      render: false,
    });
  }

  override async _onRender(
    context: ISourceBookBrowserContext,
    options: foundry.applications.api.Application.RenderOptions,
  ): Promise<void> {
    await super._onRender(context, options);

    const body = this.element.querySelector<HTMLElement>(".ddb-source-book-browser-body");
    if (body) {
      body.scrollTop = this._scrollTop;
      body.addEventListener("scroll", () => {
        this._scrollTop = body.scrollTop;
      });
    }

    const input = this.element.querySelector<HTMLInputElement>("#source-book-browser-search");
    if (!input) return;

    if (this._searchCaret) {
      input.focus();
      const { start, end } = this._searchCaret;
      try {
        input.setSelectionRange(start, end);
      } catch (_error) { /* Some embedded browsers do not support selection ranges. */ }
      this._searchCaret = null;
    }

    this._searchDebounce ??= foundry.utils.debounce(() => this.render(), 200);
    input.addEventListener("input", (event) => {
      const element = event.currentTarget as HTMLInputElement;
      this.searchTerm = element.value ?? "";
      this._searchCaret = {
        start: element.selectionStart ?? this.searchTerm.length,
        end: element.selectionEnd ?? this.searchTerm.length,
      };
      this._searchDebounce?.();
    });
  }

  override async _prepareContext(
    options: foundry.applications.api.Application.RenderOptions,
  ): Promise<ISourceBookBrowserContext> {
    const context = await super._prepareContext({ ...options, noCacheLoad: true }) as ISourceBookBrowserContext;
    context.searchTerm = this.searchTerm;
    context.categories = this._buildCategoryGroups();
    return context;
  }

  /** Only the cache part pays for the (metadata-only) cache read. */
  override async _preparePartContext(partId: string, context: ISourceBookBrowserContext): Promise<ISourceBookBrowserContext> {
    if (partId === "cache") context.cache = await this._buildCacheContext();
    context.tab = context.tabs?.[partId];
    return context;
  }

  /** Built on every render rather than memoised, so munches run while the window is open show up. */
  async _buildCacheContext(): Promise<ISourceBookBrowserCacheContext> {
    const available = DDBProxyCache.isAvailable();
    const enabled = DDBProxyCache.isEnabled();
    const entries = available ? await DDBProxyCache.list() : [];
    return {
      available,
      enabled,
      total: entries.length,
      groups: buildCacheGroups(entries),
    };
  }

  _buildCategoryGroups(): ISourceBookBrowserCategory[] {
    const search = this.searchTerm.trim().toLowerCase();
    const includedCategoryIds = new Set(DDBSources.getIncludedCategoryIds());

    return DDBSources.getDisplaySourceCategories()
      .map((category) => {
        const categoryMatches = category.name.toLowerCase().includes(search);
        const selected = includedCategoryIds.has(category.id);
        const books = DDBSources.getBooksInCategories([category.id])
          .filter((book) => book.isReleased)
          .map((book) => ({
            id: book.id,
            code: book.name,
            name: book.description || book.name,
            avatarURL: DDBSources.getSourceCoverURL(book),
            selected,
          }))
          .filter((book) => !search
            || categoryMatches
            || book.name.toLowerCase().includes(search)
            || book.code.toLowerCase().includes(search))
          .sort((a, b) => a.name.localeCompare(b.name));

        return {
          id: category.id,
          name: category.name,
          books,
          count: books.length,
          expanded: !!search || this.expandedCategories.has(category.id),
          selected,
        };
      })
      .filter((category) => category.books.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

}
