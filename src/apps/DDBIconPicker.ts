import DDBAppV2 from "./DDBAppV2";
import { iconSearch, loadIconCatalog, pickerIcons } from "../lib/IconCatalog";
import logger from "../lib/Logger";
import utils from "../lib/Utils";
import RegionDisplayProfiles from "../lib/RegionDisplayProfiles";

const FILTERS = ["all", "svg", "damage", "dnd5eStatus", "status"] as const;

/**
 * Search the icon catalogue for a region display image. Nothing in the calling editor changes
 * until an icon is chosen; the choice is handed to the `select` callback and the picker closes.
 */
export default class DDBIconPicker extends DDBAppV2 {
  private readonly selectImage: (path: string) => void;
  private icons: IIconCatalogEntry[] | null = null;
  searchTerm = "";
  filter: (typeof FILTERS)[number] = "all";
  offset = 0;
  private _searchDebounce: (() => void) | null = null;
  private _searchCaret: { start: number; end: number } | null = null;

  static readonly PAGE_SIZE = 24;

  /** `search` prefills the query; it starts selected so typing replaces it. */
  constructor(select: (path: string) => void, { search = "" }: { search?: string } = {}) {
    super();
    this.selectImage = select;
    this.searchTerm = search;
    if (search) this._searchCaret = { start: 0, end: search.length };
  }

  static override DEFAULT_OPTIONS = {
    id: "ddb-icon-picker-{id}",
    classes: ["standard-form", "ddbi-icon-picker"],
    window: { title: "ddb-importer.behaviors.display.texture.search", resizable: true },
    actions: {
      selectIcon: DDBIconPicker.selectIcon,
      previousPage: DDBIconPicker.previousPage,
      nextPage: DDBIconPicker.nextPage,
    },
    position: { width: 640, height: 580 },
  };

  static override PARTS = {
    content: { template: "modules/ddb-importer/handlebars/region-display/icon-picker.hbs" },
  };

  _getTabs(): IDDBTabs {
    return {};
  }

  static selectIcon(this: DDBIconPicker, _event: Event, target: HTMLElement) {
    const path = target.dataset.path;
    if (!path) return;
    this.selectImage(path);
    void this.close();
  }

  static previousPage(this: DDBIconPicker) {
    this.offset = Math.max(0, this.offset - DDBIconPicker.PAGE_SIZE);
    void this.render();
  }

  static nextPage(this: DDBIconPicker) {
    this.offset += DDBIconPicker.PAGE_SIZE;
    void this.render();
  }

  /** The catalogue downloads on first open; the world's status and damage icons are merged in. */
  private async _loadIcons(): Promise<IIconCatalogEntry[]> {
    if (this.icons) return this.icons;
    let catalogue: IIconCatalogEntry[] = [];
    try {
      catalogue = await loadIconCatalog();
    } catch (error) {
      logger.error("Unable to load the icon catalogue", { error });
      ui.notifications.error(RegionDisplayProfiles.localize("texture.catalogError"));
    }
    this.icons = pickerIcons(catalogue);
    return this.icons;
  }

  /**
   * The current page of matches for the search term and filter. An offset past the end (the
   * result count shrank since the last page turn) moves back to the last page.
   */
  _buildPage(icons: IIconCatalogEntry[]) {
    const matches = iconSearch(icons, this.filter)(this.searchTerm);
    const size = DDBIconPicker.PAGE_SIZE;
    if (this.offset >= matches.length) this.offset = Math.max(0, Math.floor((matches.length - 1) / size) * size);
    return {
      icons: matches.slice(this.offset, this.offset + size),
      count: matches.length,
      hasPrevious: this.offset > 0,
      hasNext: this.offset + size < matches.length,
    };
  }

  override async _prepareContext(options: any) {
    const context = (await super._prepareContext({ ...options, noCacheLoad: true })) as any;
    const page = this._buildPage(await this._loadIcons());
    context.searchTerm = this.searchTerm;
    context.filterOptions = FILTERS.map((value) => ({
      value,
      label: RegionDisplayProfiles.localize(`texture.${value}`),
      selected: value === this.filter,
    }));
    context.icons = page.icons;
    context.countLabel = utils.localizePlural("ddb-importer.behaviors.display.texture.results", page.count);
    context.hasPrevious = page.hasPrevious;
    context.hasNext = page.hasNext;
    return context;
  }

  override async _onRender(context: any, options: any) {
    await super._onRender(context, options);

    // a thumbnail whose artwork is missing from this Foundry install cannot be chosen
    for (const image of this.element.querySelectorAll<HTMLImageElement>(".ddbi-icon-results img")) {
      image.addEventListener(
        "error",
        () => {
          image.hidden = true;
          image.closest("button")?.setAttribute("disabled", "");
        },
        { once: true },
      );
    }

    this.element.querySelector<HTMLSelectElement>("[data-icon-filter]")?.addEventListener("change", (event) => {
      this.filter = (event.currentTarget as HTMLSelectElement).value as (typeof FILTERS)[number];
      this.offset = 0;
      void this.render();
    });

    const input = this.element.querySelector<HTMLInputElement>("[data-icon-query]");
    if (!input) return;
    if (this._searchCaret) {
      const { start, end } = this._searchCaret;
      input.setSelectionRange(start, end);
      this._searchCaret = null;
    }
    input.focus();
    this._searchDebounce ??= foundry.utils.debounce(() => void this.render(), 200);
    input.addEventListener("input", () => {
      this.searchTerm = input.value;
      this.offset = 0;
      this._searchCaret = {
        start: input.selectionStart ?? this.searchTerm.length,
        end: input.selectionEnd ?? this.searchTerm.length,
      };
      this._searchDebounce!();
    });
  }
}
