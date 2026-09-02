// Leaf module: imports specific files only, so the filters stay unit-testable without the
// lib barrel (which pulls in app dialogs).
import DDBSources from "./DDBSources";
import logger from "./Logger";
import utils from "./Utils";

/**
 * How many entries survived each filter stage. `raw` is the proxy payload; every later key is the
 * count after that stage ran, so the last populated stage is the final result. Stages that did not
 * run repeat the previous count, which keeps the summary readable in a log line.
 */
export interface ISourceFilterCounts {
  raw: number;
  category: number;
  book: number;
  homebrew: number;
  ids?: number;
  search: number;
}

export type TSourceFilterKind = "spells" | "items" | "monsters" | "vehicles";

type TFilterNotifier = (note: string, opts?: { nameField?: boolean }) => void;

export interface ISpellFilterOptions {
  sourceFilter: boolean;
  sources: number[];
  exactMatch: boolean;
  searchFilter?: string | null;
}

export interface IItemFilterOptions {
  ids: (number | string)[];
  useSourceFilter: boolean;
  useGenerics: boolean;
  sources: number[];
  exactMatch: boolean;
  searchFilter: string | null;
}

function finalCount(counts: ISourceFilterCounts): number {
  return counts.search;
}

export function sumCounts(list: ISourceFilterCounts[]): ISourceFilterCounts {
  const total: ISourceFilterCounts = { raw: 0, category: 0, book: 0, homebrew: 0, search: 0 };
  for (const counts of list) {
    total.raw += counts.raw;
    total.category += counts.category;
    total.book += counts.book;
    total.homebrew += counts.homebrew;
    total.search += counts.search;
    if (counts.ids !== undefined) total.ids = (total.ids ?? 0) + counts.ids;
  }
  return total;
}

/**
 * Filter the raw class spell payload down to what the muncher settings ask for. The category stage
 * rewrites `definition.sources` in place so later consumers (source attribution, folders) only see
 * the allowed books.
 */
export function applySpellFilters(
  raw: IDDBSpellEntry[],
  { sourceFilter, sources, exactMatch, searchFilter }: ISpellFilterOptions,
): { data: IDDBSpellEntry[]; counts: ISourceFilterCounts } {
  let data = raw;
  const counts: ISourceFilterCounts = { raw: raw.length, category: raw.length, book: raw.length, homebrew: raw.length, search: raw.length };
  if (sourceFilter) {
    data = data
      .map((spell) => {
        spell.definition.sources = (spell.definition.sources ?? []).filter((source) =>
          DDBSources.isSourceInAllowedCategory(source),
        );
        return spell;
      })
      .filter((spell) => {
        if (spell.definition.isHomebrew) return true;
        return (spell.definition.sources?.length ?? 0) > 0;
      });
    counts.category = data.length;
  }
  if (sources.length > 0 && sourceFilter) {
    data = data.filter((spell) =>
      spell.definition.sources?.some((source) => sources.includes(source.sourceId)) ?? false,
    );
  } else if (sources.length === 0) {
    if (utils.getSetting<boolean>("munching-policy-spell-homebrew-only")) {
      data = data.filter((spell) => spell.definition.isHomebrew);
    } else if (!utils.getSetting<boolean>("munching-policy-spell-homebrew")) {
      data = data.filter((spell) => !spell.definition.isHomebrew);
    }
  }
  counts.book = sources.length > 0 && sourceFilter ? data.length : counts.category;
  counts.homebrew = data.length;
  if (searchFilter && searchFilter !== "") {
    if (exactMatch) {
      data = data.filter((spell) => spell.definition.name.toLowerCase() === searchFilter.toLowerCase());
    } else {
      data = data.filter((spell) => spell.definition.name.toLowerCase().includes(searchFilter.toLowerCase()));
    }
  }
  counts.search = data.length;
  return { data, counts };
}

/**
 * Filter the raw item payload down to what the muncher settings ask for. Mirrors applySpellFilters;
 * the `ids` stage is the explicit-id path used by adventure imports, which skips the category stage.
 */
export function applyItemFilters(input: IDDBItemsSource, {
  ids,
  useSourceFilter,
  useGenerics,
  sources,
  exactMatch,
  searchFilter,
}: IItemFilterOptions): { data: IDDBItemsSource; counts: ISourceFilterCounts } {
  let data = input;
  const rawCount = input.items.length;
  const counts: ISourceFilterCounts = { raw: rawCount, category: rawCount, book: rawCount, homebrew: rawCount, search: rawCount };
  // category filtering
  if (ids.length === 0) {
    const categoryItems = data.items
      .map((item) => {
        // custom proxies hand back bare item arrays and can omit sources entirely
        item.sources = (item.sources ?? []).filter((source) =>
          DDBSources.isSourceInAllowedCategory(source),
        );
        return item;
      })
      .filter((item) => {
        if (item.isHomebrew) return true;
        return item.sources.length > 0;
      });
    data = { items: categoryItems, spells: data.spells, extra: data.extra };
    counts.category = data.items.length;
  }
  // source filtering
  const filteredItems = useGenerics ? data.items : data.items.filter((item) => item.canBeAddedToInventory);
  const bookFilterActive = sources.length > 0 && useSourceFilter;
  data = {
    items: bookFilterActive
      ? filteredItems.filter((item) =>
        (item.sources ?? []).some((source) => sources.includes(source.sourceId)),
      )
      : filteredItems,
    spells: data.spells,
    extra: data.extra,
  };
  counts.book = data.items.length;
  // homebrew filtering
  if (sources.length === 0) {
    if (utils.getSetting<boolean>("munching-policy-item-homebrew-only")) {
      data = { items: data.items.filter((item) => item.isHomebrew), spells: data.spells, extra: data.extra };
    } else if (!utils.getSetting<boolean>("munching-policy-item-homebrew")) {
      data = { items: data.items.filter((item) => !item.isHomebrew), spells: data.spells, extra: data.extra };
    }
  }
  counts.homebrew = data.items.length;
  if (ids.length > 0) {
    data = { items: data.items.filter((item) => ids.includes(item.id)), spells: data.spells, extra: data.extra };
    counts.ids = data.items.length;
  }
  if (searchFilter && searchFilter !== "") {
    if (exactMatch) {
      data = { items: data.items.filter((item) => item.name.toLowerCase() === searchFilter.toLowerCase()), spells: data.spells, extra: data.extra };
    } else {
      data = { items: data.items.filter((item) => item.name.toLowerCase().includes(searchFilter.toLowerCase())), spells: data.spells, extra: data.extra };
    }
  }
  counts.search = data.items.length;
  return { data, counts };
}

function bookLabel(sourceId: number): string {
  const source = (CONFIG.DDB?.sources ?? []).find((s) => s.id === sourceId);
  return source ? `${sourceId} ${source.name}` : `${sourceId}`;
}

function categoryLabel(categoryId: number): string {
  const category = (CONFIG.DDB?.sourceCategories ?? []).find((c) => c.id === categoryId);
  return category ? `${categoryId} ${category.name}` : `${categoryId}`;
}

function includedCategoryLabels(): string[] {
  return DDBSources.getAllowedSourceCategoryIds().map(categoryLabel);
}

/** One-line summary of the source settings an import is running under, for logs and warnings. */
export function describeActiveFilters(): string {
  const categories = includedCategoryLabels();
  const categoryText = categories.length > 0
    ? `included categories [${categories.join(", ")}]`
    : "no included categories";
  const bookFilter = DDBSources.getBookFilter();
  if (!bookFilter.enabled) return `${categoryText}; book filter off`;
  const effective = bookFilter.effective.map(bookLabel).join(", ");
  const ignored = bookFilter.ignored.map(bookLabel).join(", ");
  const ignoredText = bookFilter.ignored.length > 0 ? `, ignored [${ignored}] (outside included categories)` : "";
  return `${categoryText}; book filter on: effective [${effective}]${ignoredText}`;
}

/**
 * Warn about source settings that cannot produce a useful import BEFORE the download starts:
 * no included category at all, or a book filter that names only books outside the included
 * categories (which is then ignored rather than applied, see DDBSources.getBookFilter).
 */
export function preflightSourceSettings(kind: TSourceFilterKind, notifier?: TFilterNotifier | null): void {
  const categories = includedCategoryLabels();
  if (categories.length === 0) {
    const message = `No source categories are included (Muncher > Sources tab); only homebrew ${kind} can be imported.`;
    logger.warn(message);
    ui.notifications?.warn(message);
    notifier?.(message, { nameField: true });
  }
  const bookFilter = DDBSources.getBookFilter();
  if (!bookFilter.enabled || bookFilter.ignored.length === 0) return;
  const ignored = bookFilter.ignored.map(bookLabel).join(", ");
  if (bookFilter.effective.length === 0) {
    const message = `Book filter ignored: ${ignored} not in the included categories; importing every ${kind} book in [${categories.join(", ")}].`;
    logger.warn(message);
    ui.notifications?.warn(message);
    notifier?.(message, { nameField: true });
  } else {
    logger.info(`Book filter: ignoring ${ignored} (outside the included categories) for ${kind}`);
  }
}

/**
 * Log the per-stage counts, and warn the user when a non-empty payload was filtered down to
 * nothing, naming the settings responsible so the report is diagnosable after the fact.
 */
export function reportFilterResult(kind: TSourceFilterKind, counts: ISourceFilterCounts, notifier?: TFilterNotifier | null): void {
  logger.info(`[${kind}] filter stages`, counts);
  if (counts.raw === 0 || finalCount(counts) > 0) return;
  const stages = `raw ${counts.raw} > category ${counts.category} > book ${counts.book} > homebrew ${counts.homebrew}`
    + (counts.ids !== undefined ? ` > ids ${counts.ids}` : "")
    + ` > search ${counts.search}`;
  const message = `No ${kind} matched the muncher source settings (${stages}); ${describeActiveFilters()}.`;
  logger.warn(message);
  ui.notifications?.warn(message);
  notifier?.(message, { nameField: true });
}
