// @vitest-environment jsdom

import DDBSourceBookBrowser, { buildCacheGroups, describeCacheEntry } from "../../src/apps/DDBSourceBookBrowser";
import DDBSources from "../../src/lib/DDBSources";
import DDBProxyCache from "../../src/lib/DDBProxyCache";
import DDBProxyCacheSettings from "../../src/lib/DDBProxyCacheSettings";

const noOpinion = (): IProxyCacheSettingsMatch => ({ supported: false, matches: false, adoptable: false, differences: [] });

const CATEGORY_A: IDDBConfigSourceCategory = { id: 801, name: "Zeta Adventures", description: "Zeta" };
const CATEGORY_B: IDDBConfigSourceCategory = { id: 802, name: "Alpha Rules", description: "Alpha" };

function source({
  id,
  code,
  name,
  categoryId,
  released = true,
  avatarURL = "",
}: {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  released?: boolean;
  avatarURL?: string;
}): IDDBConfigSource {
  return {
    id,
    name: code,
    description: name,
    sourceCategoryId: categoryId,
    isReleased: released,
    avatarURL,
    sourceURL: `/sources/${code.toLowerCase()}`,
  };
}

// the opener hands the browser a runner rather than the change itself, so the tests drive the
// write the browser builds and assert what it would have saved
function buildQueueCategoryUpdate() {
  const runner = vi.fn(async (update: () => Promise<void>) => {
    await update();
    return true;
  });
  return runner;
}

describe("DDBSourceBookBrowser", () => {
  const originalCategories = CONFIG.DDB.sourceCategories;
  const originalSources = CONFIG.DDB.sources;
  let browser: DDBSourceBookBrowser;

  beforeEach(() => {
    CONFIG.DDB.sourceCategories = [CATEGORY_A, CATEGORY_B];
    CONFIG.DDB.sources = [
      source({ id: 1, code: "ZB", name: "Zeta Book", categoryId: CATEGORY_A.id }),
      source({ id: 2, code: "AB", name: "Alpha Book", categoryId: CATEGORY_A.id, avatarURL: "alpha.webp" }),
      source({ id: 3, code: "OLD", name: "Archived Book", categoryId: CATEGORY_A.id, released: false }),
      source({ id: 4, code: "RULES", name: "Rules Compendium", categoryId: CATEGORY_B.id }),
      // DDB sends the bare avatar directory for a book with no cover
      source({
        id: 5,
        code: "NOPIC",
        name: "Coverless Book",
        categoryId: CATEGORY_A.id,
        avatarURL: "https://www.dndbeyond.com/avatars/",
      }),
    ];
    vi.spyOn(DDBSources, "getIncludedCategoryIds").mockReturnValue([CATEGORY_A.id]);
    browser = new DDBSourceBookBrowser();
  });

  afterEach(() => {
    CONFIG.DDB.sourceCategories = originalCategories;
    CONFIG.DDB.sources = originalSources;
    vi.restoreAllMocks();
  });

  it("groups released books by sorted categories and starts collapsed", () => {
    const groups = browser._buildCategoryGroups();

    expect(groups.map((group) => group.name)).toEqual(["Alpha Rules", "Zeta Adventures"]);
    expect(groups.every((group) => !group.expanded)).toBe(true);
    expect(groups.map((group) => ({ name: group.name, selected: group.selected }))).toEqual([
      { name: "Alpha Rules", selected: false },
      { name: "Zeta Adventures", selected: true },
    ]);
    expect(groups[1].books).toEqual([
      { id: 2, code: "AB", name: "Alpha Book", avatarURL: "alpha.webp", selected: true },
      { id: 5, code: "NOPIC", name: "Coverless Book", avatarURL: null, selected: true },
      { id: 1, code: "ZB", name: "Zeta Book", avatarURL: null, selected: true },
    ]);
  });

  it("matches a category name and expands the complete matching category", () => {
    browser.searchTerm = "adventures";

    const groups = browser._buildCategoryGroups();

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Zeta Adventures");
    expect(groups[0].books.map((book) => book.name)).toEqual(["Alpha Book", "Coverless Book", "Zeta Book"]);
    expect(groups[0].expanded).toBe(true);
  });

  it.each([
    ["zeta book", "Zeta Book"],
    ["ab", "Alpha Book"],
  ])("filters books by '%s' and expands the result", (search, expectedName) => {
    browser.searchTerm = search;

    const groups = browser._buildCategoryGroups();

    expect(groups).toHaveLength(1);
    expect(groups[0].books.map((book) => book.name)).toEqual([expectedName]);
    expect(groups[0].expanded).toBe(true);
  });

  it("returns an empty result for an unmatched search", () => {
    browser.searchTerm = "not a source";
    expect(browser._buildCategoryGroups()).toEqual([]);
  });

  it("toggles a category's expanded state", () => {
    const render = vi.fn();
    const app = {
      expandedCategories: new Set<number>(),
      render,
    } as unknown as DDBSourceBookBrowser;
    const button = document.createElement("button");
    button.dataset.categoryId = String(CATEGORY_A.id);

    DDBSourceBookBrowser.toggleCategory.call(app, new Event("click"), button);
    expect(app.expandedCategories.has(CATEGORY_A.id)).toBe(true);

    DDBSourceBookBrowser.toggleCategory.call(app, new Event("click"), button);
    expect(app.expandedCategories.has(CATEGORY_A.id)).toBe(false);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("confirms category checkbox changes without toggling the group", async () => {
    const queueCategoryUpdate = buildQueueCategoryUpdate();
    const updateIncludedCategories = vi.spyOn(DDBSources, "updateIncludedCategories").mockResolvedValue();
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(true);
    const render = vi.fn(async () => undefined);
    const app = new DDBSourceBookBrowser({ queueCategoryUpdate });
    Object.defineProperty(app, "render", { value: render });
    const button = document.createElement("button");
    button.dataset.categoryId = String(CATEGORY_A.id);

    await DDBSourceBookBrowser.selectCategory.call(app, new Event("click"), button);

    expect(updateIncludedCategories).toHaveBeenCalledWith([]);
    expect(app.expandedCategories.has(CATEGORY_A.id)).toBe(false);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("confirms and adds a book's category through the opener's queue", async () => {
    vi.mocked(DDBSources.getIncludedCategoryIds).mockReturnValue([]);
    const queueCategoryUpdate = buildQueueCategoryUpdate();
    const updateIncludedCategories = vi.spyOn(DDBSources, "updateIncludedCategories").mockResolvedValue();
    const confirm = vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(true);
    const render = vi.fn(async () => undefined);
    const app = new DDBSourceBookBrowser({ queueCategoryUpdate });
    Object.defineProperty(app, "render", { value: render });
    const button = document.createElement("button");
    button.dataset.categoryId = String(CATEGORY_A.id);
    button.dataset.bookId = "2";

    await DDBSourceBookBrowser.selectBook.call(app, new Event("click"), button);

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({
      window: { title: `Add Category: ${CATEGORY_A.name}` },
      yes: { label: "Add Category" },
    }));
    expect(queueCategoryUpdate).toHaveBeenCalledTimes(1);
    expect(updateIncludedCategories).toHaveBeenCalledWith([CATEGORY_A.id]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("confirms and removes a selected book's category", async () => {
    const queueCategoryUpdate = buildQueueCategoryUpdate();
    const updateIncludedCategories = vi.spyOn(DDBSources, "updateIncludedCategories").mockResolvedValue();
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(true);
    const app = new DDBSourceBookBrowser({ queueCategoryUpdate });
    Object.defineProperty(app, "render", { value: vi.fn(async () => undefined) });
    const button = document.createElement("button");
    button.dataset.categoryId = String(CATEGORY_A.id);
    button.dataset.bookId = "1";

    await DDBSourceBookBrowser.selectBook.call(app, new Event("click"), button);

    expect(updateIncludedCategories).toHaveBeenCalledWith([]);
  });

  it("falls back to its own queue when the opener has gone away", async () => {
    const queueCategoryUpdate = vi.fn(async () => false);
    const updateIncludedCategories = vi.spyOn(DDBSources, "updateIncludedCategories").mockResolvedValue();
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(true);
    const app = new DDBSourceBookBrowser({ queueCategoryUpdate });
    Object.defineProperty(app, "render", { value: vi.fn(async () => undefined) });
    const button = document.createElement("button");
    button.dataset.categoryId = String(CATEGORY_A.id);
    button.dataset.bookId = "1";

    await DDBSourceBookBrowser.selectBook.call(app, new Event("click"), button);

    expect(queueCategoryUpdate).toHaveBeenCalledTimes(1);
    expect(updateIncludedCategories).toHaveBeenCalledWith([]);
  });

  it("reuses an open browser and re-points it at the newest opener", async () => {
    const open = Object.create(DDBSourceBookBrowser.prototype) as DDBSourceBookBrowser & { rendered: boolean };
    open.rendered = true;
    const bringToFront = vi.fn();
    Object.defineProperty(open, "bringToFront", { value: bringToFront, configurable: true });
    const instances = foundry.applications.instances as unknown as Map<string, unknown>;
    instances.set(DDBSourceBookBrowser.DEFAULT_OPTIONS.id, open);
    const queueCategoryUpdate = buildQueueCategoryUpdate();
    const updateIncludedCategories = vi.spyOn(DDBSources, "updateIncludedCategories").mockResolvedValue();
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(true);
    Object.defineProperty(open, "render", { value: vi.fn(async () => undefined), configurable: true });

    const reused = await DDBSourceBookBrowser.open({ queueCategoryUpdate });
    instances.delete(DDBSourceBookBrowser.DEFAULT_OPTIONS.id);

    // a second window would have replaced this one's DOM, losing its expanded and search state
    expect(reused).toBe(open);
    expect(bringToFront).toHaveBeenCalledTimes(1);

    const button = document.createElement("button");
    button.dataset.categoryId = String(CATEGORY_A.id);
    await DDBSourceBookBrowser.selectCategory.call(reused, new Event("click"), button);

    expect(queueCategoryUpdate).toHaveBeenCalledTimes(1);
    expect(updateIncludedCategories).toHaveBeenCalledWith([]);
  });

  it("leaves the category unchanged when the dialog is cancelled", async () => {
    const queueCategoryUpdate = buildQueueCategoryUpdate();
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(false);
    const app = new DDBSourceBookBrowser({ queueCategoryUpdate });
    const button = document.createElement("button");
    button.dataset.categoryId = String(CATEGORY_A.id);
    button.dataset.bookId = "1";

    await DDBSourceBookBrowser.selectBook.call(app, new Event("click"), button);

    expect(queueCategoryUpdate).not.toHaveBeenCalled();
  });
});

function entry(domain: IProxyCacheEntry["domain"], params: Record<string, unknown>, createdAt = 1000, expiresAt = 2000): IProxyCacheEntry {
  return { key: `${domain}:${JSON.stringify(params)}`, namespace: "ns", domain, params, createdAt, expiresAt };
}

describe("DDBSourceBookBrowser cache management", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens on the source selection tab with a cache management tab beside it", () => {
    const browser = new DDBSourceBookBrowser();
    const tabs = browser._getTabs();
    expect(Object.keys(tabs)).toEqual(["sources", "cache"]);
    expect(tabs.sources).toMatchObject({ id: "sources", group: "sheet", label: "Source Selection", active: true });
    expect(tabs.cache).toMatchObject({ id: "cache", group: "sheet", label: "Cache Management", active: false });
    expect(browser.tabGroups.sheet).toBe("sources");
  });

  it("describes entries per domain from their secret-free params", () => {
    expect(describeCacheEntry("spells", { className: "Wizard", rulesVersion: "2024" })).toBe("Spells: Wizard (2024)");
    expect(describeCacheEntry("items", { campaignId: null, addSpells: true })).toBe("Items: full catalogue");
    expect(describeCacheEntry("items", { campaignId: "123", addSpells: true })).toBe("Items: full catalogue (campaign 123)");
    // sources, homebrew and types live on the detail line; exact match only matters with a term
    expect(describeCacheEntry("monsters", { search: "", sources: [1, 2], homebrew: false, exactMatch: true })).toBe("Monsters: all");
    expect(describeCacheEntry("monsters", { search: "dragon", homebrewOnly: true, excludeLegacy: true, exactMatch: true, sources: [] }))
      .toBe("Monsters: search \"dragon\", exact match, no legacy");
    expect(describeCacheEntry("vehicles", { search: "", homebrew: true, sources: [5] })).toBe("Vehicles: all");
    expect(describeCacheEntry("mule-list", { type: "feat", sources: [1] })).toBe("feat list");
    expect(describeCacheEntry("subclasses", { className: "Fighter", rulesVersion: "2014" })).toBe("Subclasses: Fighter (2014)");
    // the stored label names the class and its subclasses; ids are only the fallback for old entries
    expect(describeCacheEntry("mule-stream", { element: "class", classId: 12, systemRules: "2024" }, "Fighter: Battle Master, Champion")).toBe("Fighter: Battle Master, Champion (2024)");
    expect(describeCacheEntry("mule-stream", { element: "class", classId: 12, systemRules: "2024" })).toBe("Munch: class class 12 (2024)");
    expect(describeCacheEntry("mule-stream", { element: "background", backgroundId: 7, systemRules: "2014" })).toBe("Munch: background background 7 (2014)");
  });

  it("groups entries in display order and collapses monster ids into one row", () => {
    const groups = buildCacheGroups([
      entry("monster-id", { id: 1 }, 100, 900),
      entry("spells", { className: "Cleric", rulesVersion: "2014" }, 200),
      entry("monster-id", { id: 2 }, 300, 500),
      entry("spells", { className: "Wizard", rulesVersion: "2024" }, 400),
    ], noOpinion);
    expect(groups.map((group) => group.domain)).toEqual(["spells", "monster-id"]);
    expect(groups[0].count).toBe(2);
    // newest first within a group
    expect(groups[0].rows.map((row) => row.label)).toEqual(["Spells: Wizard (2024)", "Spells: Cleric (2014)"]);
    expect(groups[1].count).toBe(2);
    expect(groups[1].rows).toHaveLength(1);
    expect(groups[1].rows[0].label).toBe("Monsters by id: 2 records");
  });

  it("builds the cache context from the live listing", async () => {
    vi.spyOn(DDBProxyCache, "isAvailable").mockReturnValue(true);
    vi.spyOn(DDBProxyCache, "isEnabled").mockReturnValue(true);
    vi.spyOn(DDBProxyCache, "list").mockResolvedValue([entry("items", { campaignId: null })]);
    vi.spyOn(DDBProxyCacheSettings, "evaluate").mockReturnValue({ supported: true, matches: true, adoptable: false, differences: [] });
    const context = await new DDBSourceBookBrowser()._buildCacheContext();
    expect(context).toMatchObject({ available: true, enabled: true, total: 1 });
    expect(context.groups[0].rows[0]).toMatchObject({ label: "Items: full catalogue", matchesSettings: true, adoptable: false });
  });

  it("does not read the store when IndexedDB is unavailable", async () => {
    vi.spyOn(DDBProxyCache, "isAvailable").mockReturnValue(false);
    vi.spyOn(DDBProxyCache, "isEnabled").mockReturnValue(false);
    const list = vi.spyOn(DDBProxyCache, "list");
    const context = await new DDBSourceBookBrowser()._buildCacheContext();
    expect(context).toEqual({ available: false, enabled: false, total: 0, groups: [] });
    expect(list).not.toHaveBeenCalled();
  });

  it("clears the cache after confirmation", async () => {
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(true);
    const clear = vi.spyOn(DDBProxyCache, "clear").mockResolvedValue();
    const info = vi.spyOn(ui.notifications, "info");
    const render = vi.fn(async () => undefined);
    const app = new DDBSourceBookBrowser();
    Object.defineProperty(app, "render", { value: render });

    await DDBSourceBookBrowser.clearProxyCache.call(app, new Event("click"), document.createElement("button"));

    expect(clear).toHaveBeenCalledWith();
    expect(info).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("carries each entry's key onto its row so it can be expired alone", () => {
    const groups = buildCacheGroups([
      entry("subclasses", { className: "Fighter", rulesVersion: "2024" }),
      entry("monster-id", { id: 1 }),
    ], noOpinion);
    // display order puts monster ids before subclasses
    expect(groups[0].rows[0].key).toBeUndefined();
    expect(groups[1].rows[0].key).toBe(entry("subclasses", { className: "Fighter", rulesVersion: "2024" }).key);
  });

  it("marks rows the current settings would hit and offers to adopt the others", () => {
    const evaluate = (_domain: TProxyCacheDomain, params: Record<string, unknown>): IProxyCacheSettingsMatch => (params.search === "old"
      ? { supported: true, matches: false, adoptable: true, differences: ["homebrew: on (now off)", "books: entry has PHB"] }
      : { supported: true, matches: true, adoptable: false, differences: [] });
    const groups = buildCacheGroups([
      entry("monsters", { search: "", excludedCategories: [], sources: [] }, 200),
      entry("monsters", { search: "old", excludedCategories: [], sources: [2], homebrew: true }, 100),
    ], evaluate);
    expect(groups[0].rows.map((row) => [row.matchesSettings, row.adoptable])).toEqual([[true, false], [false, true]]);
    expect(groups[0].rows[1].differences).toBe("homebrew: on (now off)\nbooks: entry has PHB");
    expect(groups[0].rows[0].detail).toContain("Categories:");
  });

  it("adopts an entry's settings through the opener's queue and fills in the search box", async () => {
    const stored = entry("monsters", { search: "dragon", excludedCategories: [], sources: [2] });
    vi.spyOn(DDBProxyCache, "list").mockResolvedValue([stored]);
    const adopt = vi.spyOn(DDBProxyCacheSettings, "adopt").mockResolvedValue(true);
    const info = vi.spyOn(ui.notifications, "info");
    const muncher = { rendered: true, searchTermMonster: "" };
    foundry.applications.instances.set("ddb-importer-monsters", muncher as unknown as Parameters<typeof foundry.applications.instances.set>[1]);
    const queueCategoryUpdate = buildQueueCategoryUpdate();
    const render = vi.fn(async () => undefined);
    const app = new DDBSourceBookBrowser({ queueCategoryUpdate });
    Object.defineProperty(app, "render", { value: render });
    const button = document.createElement("button");
    button.dataset.key = stored.key;

    await DDBSourceBookBrowser.adoptCacheSettings.call(app, new Event("click"), button);

    // the writes run on the muncher's queue under their own key, so a munch clicked next drains them
    expect(queueCategoryUpdate).toHaveBeenCalledWith(expect.any(Function), "proxy-cache-adopt");
    expect(adopt).toHaveBeenCalledWith("monsters", stored.params);
    expect(info).toHaveBeenCalledTimes(1);
    // the search box is part of the request, so it is filled in for the queued re-render
    expect(muncher.searchTermMonster).toBe("dragon");
    expect(render).toHaveBeenCalledTimes(1);
    foundry.applications.instances.delete("ddb-importer-monsters");
  });

  it("adopts on its own queue when no muncher is open", async () => {
    const stored = entry("spells", { className: "Wizard", campaignId: "123" });
    vi.spyOn(DDBProxyCache, "list").mockResolvedValue([stored]);
    const adopt = vi.spyOn(DDBProxyCacheSettings, "adopt").mockResolvedValue(true);
    const app = new DDBSourceBookBrowser();
    Object.defineProperty(app, "render", { value: vi.fn(async () => undefined) });
    const button = document.createElement("button");
    button.dataset.key = stored.key;

    await DDBSourceBookBrowser.adoptCacheSettings.call(app, new Event("click"), button);

    expect(adopt).toHaveBeenCalledWith("spells", stored.params);
  });

  it("warns instead of adopting when the entry has since gone", async () => {
    vi.spyOn(DDBProxyCache, "list").mockResolvedValue([]);
    const adopt = vi.spyOn(DDBProxyCacheSettings, "adopt");
    const warn = vi.spyOn(ui.notifications, "warn");
    const app = new DDBSourceBookBrowser();
    Object.defineProperty(app, "render", { value: vi.fn(async () => undefined) });
    const button = document.createElement("button");
    button.dataset.key = "gone";

    await DDBSourceBookBrowser.adoptCacheSettings.call(app, new Event("click"), button);

    expect(adopt).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("passes a mule entry's original selection to matching but refuses adoption", async () => {
    const stored = entry("mule-stream", { element: "class", sources: [2] });
    stored.sourceSelection = { categories: [1], books: [], runSources: [2, 3] };
    const evaluate = vi.fn(noOpinion);
    buildCacheGroups([stored], evaluate);
    expect(evaluate).toHaveBeenCalledWith(stored.domain, stored.params, stored.sourceSelection);

    vi.spyOn(DDBProxyCache, "list").mockResolvedValue([stored]);
    const adopt = vi.spyOn(DDBProxyCacheSettings, "adopt").mockResolvedValue(true);
    const app = new DDBSourceBookBrowser();
    Object.defineProperty(app, "render", { value: vi.fn(async () => undefined) });
    const button = document.createElement("button");
    button.dataset.key = stored.key;
    await DDBSourceBookBrowser.adoptCacheSettings.call(app, new Event("click"), button);
    expect(adopt).not.toHaveBeenCalled();
  });

  it("expires a single entry without confirmation", async () => {
    const confirm = vi.spyOn(foundry.applications.api.DialogV2, "confirm");
    const deleteKeys = vi.spyOn(DDBProxyCache, "deleteKeys").mockResolvedValue();
    const render = vi.fn(async () => undefined);
    const app = new DDBSourceBookBrowser();
    Object.defineProperty(app, "render", { value: render });
    const button = document.createElement("button");
    button.dataset.key = "ns::subclasses::{\"className\":\"Fighter\"}";

    await DDBSourceBookBrowser.deleteCacheEntry.call(app, new Event("click"), button);

    expect(confirm).not.toHaveBeenCalled();
    expect(deleteKeys).toHaveBeenCalledWith(["ns::subclasses::{\"className\":\"Fighter\"}"]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("expires a whole domain after confirmation", async () => {
    const confirm = vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(true);
    const clear = vi.spyOn(DDBProxyCache, "clear").mockResolvedValue();
    const render = vi.fn(async () => undefined);
    const app = new DDBSourceBookBrowser();
    Object.defineProperty(app, "render", { value: render });
    const button = document.createElement("button");
    button.dataset.domain = "monster-id";

    await DDBSourceBookBrowser.clearCacheDomain.call(app, new Event("click"), button);

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ window: { title: "Clear Cache: Monsters by id" } }));
    expect(clear).toHaveBeenCalledWith("monster-id");
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("ignores a domain clear that is cancelled or names an unknown domain", async () => {
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(false);
    const clear = vi.spyOn(DDBProxyCache, "clear").mockResolvedValue();
    const app = new DDBSourceBookBrowser();
    const button = document.createElement("button");
    button.dataset.domain = "spells";
    await DDBSourceBookBrowser.clearCacheDomain.call(app, new Event("click"), button);
    button.dataset.domain = "nonsense";
    await DDBSourceBookBrowser.clearCacheDomain.call(app, new Event("click"), button);
    expect(clear).not.toHaveBeenCalled();
  });

  it("leaves the caches alone when the clear is cancelled", async () => {
    vi.spyOn(foundry.applications.api.DialogV2, "confirm").mockResolvedValue(false);
    const clear = vi.spyOn(DDBProxyCache, "clear").mockResolvedValue();
    const render = vi.fn(async () => undefined);
    const app = new DDBSourceBookBrowser();
    Object.defineProperty(app, "render", { value: render });

    await DDBSourceBookBrowser.clearProxyCache.call(app, new Event("click"), document.createElement("button"));

    expect(clear).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });
});
