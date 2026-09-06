import { setMockSettings } from "../_setup/foundryMocks";
import DDBSources from "../../src/lib/DDBSources";
import {
  applySpellFilters,
  applyItemFilters,
  sumCounts,
  describeActiveFilters,
  preflightSourceSettings,
  reportFilterResult,
} from "../../src/lib/SourceFilters";

// The test setup populates CONFIG.DDB with the real shipped fallback config, so real ids are used:
//   PHB (2) sits in category 26 "5e Core Rules"; EGtW (59) in category 2 "Critical Role";
//   NWB (238) in category 21 "Kobold Press".

function spell(name: string, sourceIds: number[], { isHomebrew = false } = {}): IDDBSpellEntry {
  return {
    definition: {
      name,
      isHomebrew,
      sources: sourceIds.map((sourceId) => ({ sourceId, sourceType: 1, pageNumber: null })),
    },
  } as unknown as IDDBSpellEntry;
}

function item(name: string, sourceIds: number[] | null, { isHomebrew = false, id = 1 } = {}): IDDBItemDefinition {
  return {
    id,
    name,
    isHomebrew,
    canBeAddedToInventory: true,
    sources: sourceIds === null
      ? undefined
      : sourceIds.map((sourceId) => ({ sourceId, sourceType: 1, pageNumber: null })),
  } as unknown as IDDBItemDefinition;
}

function itemSource(items: IDDBItemDefinition[]): IDDBItemsSource {
  return { items, spells: [], extra: [] };
}

function settings(overrides: Record<string, unknown> = {}) {
  setMockSettings({
    "munching-policy-muncher-included-source-categories": [2],
    "munching-policy-use-source-filter": false,
    "munching-policy-muncher-sources": [],
    "munching-policy-spell-homebrew": false,
    "munching-policy-spell-homebrew-only": false,
    "munching-policy-item-homebrew": false,
    "munching-policy-item-homebrew-only": false,
    ...overrides,
  });
}

const spellOptions = { sourceFilter: true, sources: [] as number[], exactMatch: false, searchFilter: "" };
const itemOptions = { ids: [] as number[], useSourceFilter: true, useGenerics: true, sources: [] as number[], exactMatch: false, searchFilter: null as string | null };

describe("applySpellFilters", () => {
  it("keeps Critical Role spells and drops core-only spells when only the Critical Role category is included", () => {
    settings();
    const raw = [spell("Fortune's Favor", [59]), spell("Fireball", [2]), spell("Reprint", [2, 59])];
    const { data, counts } = applySpellFilters(raw, spellOptions);
    expect(data.map((s) => s.definition.name)).toEqual(["Fortune's Favor", "Reprint"]);
    expect(data[1]?.definition.sources?.map((s) => s.sourceId)).toEqual([59]);
    expect(counts).toEqual({ raw: 3, category: 2, book: 2, homebrew: 2, search: 2 });
  });

  it("no longer returns nothing when the book filter names only books outside the included categories", () => {
    settings({ "munching-policy-use-source-filter": true, "munching-policy-muncher-sources": [2] });
    const sources = DDBSources.getBookFilter().effective;
    expect(sources).toEqual([]);
    const { data, counts } = applySpellFilters([spell("Fortune's Favor", [59])], { ...spellOptions, sources });
    expect(data).toHaveLength(1);
    expect(counts.book).toBe(counts.category);
  });

  it("applies an effective book filter", () => {
    settings({
      "munching-policy-muncher-included-source-categories": [26, 2],
      "munching-policy-use-source-filter": true,
      "munching-policy-muncher-sources": [59],
    });
    const sources = DDBSources.getBookFilter().effective;
    const raw = [spell("Fortune's Favor", [59]), spell("Fireball", [2]), spell("Brew", [], { isHomebrew: true })];
    const { data, counts } = applySpellFilters(raw, { ...spellOptions, sources });
    expect(data.map((s) => s.definition.name)).toEqual(["Fortune's Favor"]);
    expect(counts).toEqual({ raw: 3, category: 3, book: 1, homebrew: 1, search: 1 });
  });

  it("drops everything but allowed homebrew when no category is included", () => {
    settings({ "munching-policy-muncher-included-source-categories": [], "munching-policy-spell-homebrew": true });
    const raw = [spell("Fortune's Favor", [59]), spell("Brew", [], { isHomebrew: true })];
    const { data, counts } = applySpellFilters(raw, spellOptions);
    expect(data.map((s) => s.definition.name)).toEqual(["Brew"]);
    expect(counts.category).toBe(1);
  });

  it("honours the homebrew toggles when no book filter is active", () => {
    settings();
    const raw = [spell("Fortune's Favor", [59]), spell("Brew", [], { isHomebrew: true })];
    expect(applySpellFilters(raw, spellOptions).data.map((s) => s.definition.name)).toEqual(["Fortune's Favor"]);
    settings({ "munching-policy-spell-homebrew-only": true });
    expect(applySpellFilters(raw, spellOptions).data.map((s) => s.definition.name)).toEqual(["Brew"]);
  });

  it("applies the search filter partially or exactly", () => {
    settings();
    const raw = [spell("Fortune's Favor", [59]), spell("Fortune", [59])];
    expect(applySpellFilters(raw, { ...spellOptions, searchFilter: "fortune" }).data).toHaveLength(2);
    const exact = applySpellFilters(raw, { ...spellOptions, searchFilter: "fortune", exactMatch: true });
    expect(exact.data.map((s) => s.definition.name)).toEqual(["Fortune"]);
    expect(exact.counts.search).toBe(1);
  });

  it("bypasses the category and book stages when sourceFilter is off", () => {
    settings({ "munching-policy-muncher-included-source-categories": [] });
    const { data, counts } = applySpellFilters([spell("Fireball", [2])], { ...spellOptions, sourceFilter: false });
    expect(data).toHaveLength(1);
    expect(counts.category).toBe(1);
  });
});

describe("applyItemFilters", () => {
  it("keeps Critical Role items and drops core-only items when only the Critical Role category is included", () => {
    settings();
    const raw = itemSource([item("Dunamancy Focus", [59], { id: 1 }), item("Longsword", [2], { id: 2 }), item("Reprint", [2, 59], { id: 3 })]);
    const { data, counts } = applyItemFilters(raw, itemOptions);
    expect(data.items.map((i) => i.name)).toEqual(["Dunamancy Focus", "Reprint"]);
    expect(data.items[1].sources.map((s) => s.sourceId)).toEqual([59]);
    expect(counts).toEqual({ raw: 3, category: 2, book: 2, homebrew: 2, search: 2 });
  });

  it("no longer returns nothing when the book filter names only books outside the included categories", () => {
    settings({ "munching-policy-use-source-filter": true, "munching-policy-muncher-sources": [2] });
    const sources = DDBSources.getBookFilter().effective;
    const { data } = applyItemFilters(itemSource([item("Dunamancy Focus", [59])]), { ...itemOptions, sources });
    expect(data.items).toHaveLength(1);
  });

  it("applies an effective book filter and skips the homebrew stage", () => {
    settings({
      "munching-policy-muncher-included-source-categories": [26, 2],
      "munching-policy-use-source-filter": true,
      "munching-policy-muncher-sources": [59],
    });
    const sources = DDBSources.getBookFilter().effective;
    const raw = itemSource([item("Dunamancy Focus", [59], { id: 1 }), item("Longsword", [2], { id: 2 })]);
    const { data, counts } = applyItemFilters(raw, { ...itemOptions, sources });
    expect(data.items.map((i) => i.name)).toEqual(["Dunamancy Focus"]);
    expect(counts.book).toBe(1);
  });

  it("does not throw on an item without sources", () => {
    settings();
    const raw = itemSource([item("Bare", null, { id: 1 }), item("Dunamancy Focus", [59], { id: 2 })]);
    const { data } = applyItemFilters(raw, itemOptions);
    expect(data.items.map((i) => i.name)).toEqual(["Dunamancy Focus"]);
  });

  it("filters to explicit ids without the category stage and records the ids stage", () => {
    settings({ "munching-policy-muncher-included-source-categories": [] });
    const raw = itemSource([item("Longsword", [2], { id: 7 }), item("Dagger", [2], { id: 8 })]);
    const { data, counts } = applyItemFilters(raw, { ...itemOptions, ids: [7] });
    expect(data.items.map((i) => i.name)).toEqual(["Longsword"]);
    expect(counts.ids).toBe(1);
    expect(counts.category).toBe(2);
  });

  it("honours the homebrew toggles when no book filter is active", () => {
    settings({ "munching-policy-item-homebrew-only": true });
    const raw = itemSource([item("Dunamancy Focus", [59], { id: 1 }), item("Brew", [], { isHomebrew: true, id: 2 })]);
    expect(applyItemFilters(raw, itemOptions).data.items.map((i) => i.name)).toEqual(["Brew"]);
  });
});

describe("sumCounts", () => {
  it("adds every stage and only sets ids when a part carried it", () => {
    const total = sumCounts([
      { raw: 2, category: 1, book: 1, homebrew: 1, search: 1 },
      { raw: 3, category: 3, book: 2, homebrew: 2, search: 0 },
    ]);
    expect(total).toEqual({ raw: 5, category: 4, book: 3, homebrew: 3, search: 1 });
    expect(sumCounts([{ raw: 1, category: 1, book: 1, homebrew: 1, ids: 1, search: 1 }]).ids).toBe(1);
  });
});

describe("describeActiveFilters", () => {
  it("names the included categories and the book filter state", () => {
    settings();
    expect(describeActiveFilters()).toBe("included categories [2 Critical Role]; book filter off");
    settings({ "munching-policy-use-source-filter": true, "munching-policy-muncher-sources": [59, 2] });
    expect(describeActiveFilters()).toBe(
      "included categories [2 Critical Role]; book filter on: effective [59 EGtW], ignored [2 PHB] (outside included categories)",
    );
  });
});

describe("preflightSourceSettings", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(ui.notifications, "warn");
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("warns when no category is included", () => {
    settings({ "munching-policy-muncher-included-source-categories": [] });
    const notifier = vi.fn();
    preflightSourceSettings("spells", notifier);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No source categories are included"));
    expect(notifier).toHaveBeenCalledTimes(1);
  });

  it("warns when the book filter is ignored entirely", () => {
    settings({ "munching-policy-use-source-filter": true, "munching-policy-muncher-sources": [2] });
    preflightSourceSettings("items");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Book filter ignored: 2 PHB"));
  });

  it("stays quiet for a partially effective book filter and for a clean setup", () => {
    settings({ "munching-policy-use-source-filter": true, "munching-policy-muncher-sources": [2, 59] });
    preflightSourceSettings("items");
    settings();
    preflightSourceSettings("spells");
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("reportFilterResult", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    settings();
    warn = vi.spyOn(ui.notifications, "warn");
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("warns with the stage counts only when a non-empty payload filtered to nothing", () => {
    const notifier = vi.fn();
    reportFilterResult("spells", { raw: 10, category: 0, book: 0, homebrew: 0, search: 0 }, notifier);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("raw 10 > category 0 > book 0 > homebrew 0 > search 0"));
    expect(notifier).toHaveBeenCalledTimes(1);
    warn.mockClear();
    reportFilterResult("spells", { raw: 10, category: 4, book: 4, homebrew: 4, search: 4 });
    reportFilterResult("items", { raw: 0, category: 0, book: 0, homebrew: 0, search: 0 });
    expect(warn).not.toHaveBeenCalled();
  });
});
