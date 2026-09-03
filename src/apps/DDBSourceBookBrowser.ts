import DDBAppV2 from "./DDBAppV2";
import DDBSources from "../lib/DDBSources";

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
}

interface IDDBSourceBookBrowserOptions {
  /**
   * Runs the browser's category write on the opening application's update queue, so both windows
   * order their writes to this setting together. Returns false when that application has gone
   * away, leaving the browser to fall back to its own queue.
   */
  queueCategoryUpdate?: (update: () => Promise<void>) => Promise<boolean>;
}

/**
 * Catalog of released DDB source books, grouped by the categories DDB assigns them to.
 */
export default class DDBSourceBookBrowser extends DDBAppV2 {

  expandedCategories = new Set<number>();
  searchTerm = "";

  private _queueCategoryUpdate: ((update: () => Promise<void>) => Promise<boolean>) | null;
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
      title: "Source Category Selection",
      icon: "fas fa-book-open",
      resizable: true,
      minimizable: true,
    },
    actions: {
      selectBook: DDBSourceBookBrowser.selectBook,
      selectCategory: DDBSourceBookBrowser.selectCategory,
      toggleCategory: DDBSourceBookBrowser.toggleCategory,
    },
    position: { width: 900, height: 720 },
  };

  static override PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/source-book-browser/browser.hbs",
    },
  };

  _getTabs(): IDDBTabs {
    return {};
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
