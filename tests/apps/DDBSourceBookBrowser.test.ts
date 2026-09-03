// @vitest-environment jsdom

import DDBSourceBookBrowser from "../../src/apps/DDBSourceBookBrowser";
import DDBSources from "../../src/lib/DDBSources";

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
