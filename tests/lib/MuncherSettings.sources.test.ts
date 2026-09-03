// @vitest-environment jsdom

import SETTINGS from "../../src/config/settings/settings";
import DDBMuncher from "../../src/apps/DDBMuncher";
import DDBSources from "../../src/lib/DDBSources";
import MuncherSettings from "../../src/lib/MuncherSettings";
import { setMockSettings } from "../_setup/foundryMocks";

const CATEGORY_A: IDDBConfigSourceCategory = { id: 701, name: "Zeta Rules", description: "Zeta" };
const CATEGORY_B: IDDBConfigSourceCategory = { id: 702, name: "Alpha Rules", description: "Alpha" };

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

describe("Muncher selected source summaries", () => {
  const originalCategories = CONFIG.DDB.sourceCategories;
  const originalSources = CONFIG.DDB.sources;

  beforeEach(() => {
    CONFIG.DDB.sourceCategories = [CATEGORY_A, CATEGORY_B];
    CONFIG.DDB.sources = [
      source({ id: 1, code: "ZB", name: "Zeta Book", categoryId: CATEGORY_A.id }),
      source({ id: 2, code: "AB", name: "Alpha Book", categoryId: CATEGORY_A.id, avatarURL: "alpha.webp" }),
      source({ id: 3, code: "OLD", name: "Archived Book", categoryId: CATEGORY_A.id, released: false }),
      source({ id: 4, code: "OTHER", name: "Other Book", categoryId: CATEGORY_B.id }),
      // DDB sends the bare avatar directory for a book with no cover
      source({
        id: 5,
        code: "NOPIC",
        name: "Coverless Book",
        categoryId: CATEGORY_A.id,
        avatarURL: "https://www.dndbeyond.com/avatars/",
      }),
    ];
  });

  afterEach(() => {
    CONFIG.DDB.sourceCategories = originalCategories;
    CONFIG.DDB.sources = originalSources;
    vi.restoreAllMocks();
  });

  it("includes only released books from selected categories and sorts by display name", () => {
    vi.spyOn(DDBSources, "getIncludedCategoryIds").mockReturnValue([CATEGORY_A.id]);

    expect(MuncherSettings.getIncludedCategoryBookMapping()).toEqual([{
      id: CATEGORY_A.id,
      name: CATEGORY_A.name,
      books: [
        { id: 2, code: "AB", name: "Alpha Book", avatarURL: "alpha.webp" },
        { id: 5, code: "NOPIC", name: "Coverless Book", avatarURL: null },
        { id: 1, code: "ZB", name: "Zeta Book", avatarURL: null },
      ],
    }]);
  });

  it("sorts selected category boxes and supports an empty selection", () => {
    vi.spyOn(DDBSources, "getIncludedCategoryIds").mockReturnValue([CATEGORY_A.id, CATEGORY_B.id]);
    expect(MuncherSettings.getIncludedCategoryBookMapping().map((category) => category.name))
      .toEqual(["Alpha Rules", "Zeta Rules"]);

    vi.mocked(DDBSources.getIncludedCategoryIds).mockReturnValue([]);
    expect(MuncherSettings.getIncludedCategoryBookMapping()).toEqual([]);
  });

  it("previews every book in the included categories when no book filter is on", () => {
    setMockSettings({
      "munching-policy-muncher-included-source-categories": [CATEGORY_A.id, CATEGORY_B.id],
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-sources": [],
    });

    const selection = MuncherSettings.getEffectiveSourceSelection();

    expect(selection.categories.map((category) => ({
      name: category.name,
      books: category.books.map((book) => book.name),
    }))).toEqual([
      { name: "Alpha Rules", books: ["Other Book"] },
      // the unreleased Archived Book is in the request but can never return content
      { name: "Zeta Rules", books: ["Alpha Book", "Coverless Book", "Zeta Book"] },
    ]);
    expect(selection.bookCount).toBe(4);
    expect(selection.bookFilterActive).toBe(false);
    expect(selection.ignoredBooks).toEqual([]);
  });

  it("narrows the preview to the deprecated book filter, exactly as an import would", () => {
    setMockSettings({
      "munching-policy-muncher-included-source-categories": [CATEGORY_A.id, CATEGORY_B.id],
      "munching-policy-use-source-filter": true,
      "munching-policy-muncher-sources": [1],
    });

    const selection = MuncherSettings.getEffectiveSourceSelection();

    expect(selection.categories.map((category) => ({
      name: category.name,
      books: category.books.map((book) => book.name),
    }))).toEqual([{ name: "Zeta Rules", books: ["Zeta Book"] }]);
    expect(selection.bookFilterActive).toBe(true);
  });

  it("reports book filter entries outside the included categories, which are ignored", () => {
    setMockSettings({
      "munching-policy-muncher-included-source-categories": [CATEGORY_A.id],
      "munching-policy-use-source-filter": true,
      // book 4 lives in the category that is not included, so DDB never sees it
      "munching-policy-muncher-sources": [1, 4],
    });

    const selection = MuncherSettings.getEffectiveSourceSelection();

    expect(selection.categories.map((category) => category.name)).toEqual(["Zeta Rules"]);
    expect(selection.bookFilterActive).toBe(true);
    expect(selection.ignoredBooks).toEqual(["Other Book"]);
  });

  it("previews nothing when no category is included", () => {
    setMockSettings({
      "munching-policy-muncher-included-source-categories": [],
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-sources": [],
    });

    const selection = MuncherSettings.getEffectiveSourceSelection();

    expect(selection.categories).toEqual([]);
    expect(selection.bookCount).toBe(0);
  });

  it("registers a hidden, player-scoped, text-first display preference", () => {
    expect(SETTINGS.DEFAULT_SETTINGS.READY.MUNCHER.MUNCH["muncher-show-source-book-covers"]).toMatchObject({
      scope: "player",
      type: Boolean,
      default: false,
    });
  });

  it("restores the remembered display preference in the muncher context", () => {
    setMockSettings({
      "add-ddb-snippets-to-activities": false,
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-sources": [],
      "munching-policy-muncher-included-source-categories": [CATEGORY_A.id],
      "munching-policy-muncher-monster-types": [],
      "muncher-show-source-book-covers": true,
    });
    (game.settings as unknown as { settings: Map<string, unknown> }).settings = new Map([
      ["ddb-importer.munching-selection-compendium-folders-monster", { choices: {} }],
      ["ddb-importer.munching-selection-compendium-folders-spell", { choices: {} }],
      ["ddb-importer.munching-selection-compendium-folders-item", { choices: {} }],
    ]);

    const context = MuncherSettings.getMuncherSettings(false);

    expect(context.showSourceBookCovers).toBe(true);
    expect(context.includedCategoryBooks).toHaveLength(1);
  });

  it("toggles and persists the current user's source-book view", async () => {
    setMockSettings({ "muncher-show-source-book-covers": false });
    const set = vi.spyOn(game.settings, "set").mockResolvedValue(undefined);
    const render = vi.fn(async () => undefined);
    const app = { render } as unknown as DDBMuncher;

    await DDBMuncher.toggleSourceBookView.call(app, new Event("click"), document.createElement("button"));

    expect(set).toHaveBeenCalledWith("ddb-importer", "muncher-show-source-book-covers", true);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
