import DDBProxyCacheSettings from "../../src/lib/DDBProxyCacheSettings";
import DDBSources from "../../src/lib/DDBSources";
import Utils from "../../src/lib/Utils";
import { setMockSettings, resetMockSettings } from "../_setup/foundryMocks";

const CORE_2014 = { id: 1, name: "Core Rules (2014)", description: null } as IDDBConfigSourceCategory;
const EXPANDED_2014 = { id: 24, name: "Expanded Rules (2014)", description: null } as IDDBConfigSourceCategory;
const CORE_2024 = { id: 26, name: "Core Rules (2024)", description: null } as IDDBConfigSourceCategory;

function book(id: number, code: string, categoryId: number): IDDBConfigSource {
  return {
    id, name: code, description: code, sourceCategoryId: categoryId, isReleased: true, avatarURL: "", sourceURL: "",
  } as IDDBConfigSource;
}

describe("DDBProxyCacheSettings", () => {
  const originalCategories = CONFIG.DDB.sourceCategories;
  const originalSources = CONFIG.DDB.sources;
  // every category CONFIG knows about that is not always hidden or excluded
  let allExcludedWhenAllIncluded: number[];

  beforeEach(() => {
    CONFIG.DDB.sourceCategories = [CORE_2014, EXPANDED_2014, CORE_2024];
    CONFIG.DDB.sources = [book(2, "PHB", 1), book(3, "MM", 1), book(67, "TCE", 24), book(145, "PHB24", 26)];
    resetMockSettings();
    setMockSettings({
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-sources": [],
      "munching-policy-muncher-included-source-categories": [1, 24, 26],
      "munching-policy-muncher-monster-types": [],
      "munching-policy-monster-homebrew": false,
      "munching-policy-monster-homebrew-only": false,
      "munching-policy-monster-exact-match": false,
      "munching-policy-character-class-rules-version": "2024",
      "munching-policy-character-optional-class-features": false,
      "munching-policy-character-fetch-homebrew": false,
      "munching-policy-character-only-homebrew": false,
      "campaign-id": "",
      // a modern world: mule requests carry systemRules 2024 and the muncher's own rules choice
      // reaches them only as include2014Adjusted
      "dnd5e.rulesVersion": "modern",
    });
    allExcludedWhenAllIncluded = DDBSources.getAllExcludedCategoryIds();
  });

  afterEach(() => {
    CONFIG.DDB.sourceCategories = originalCategories;
    CONFIG.DDB.sources = originalSources;
    vi.restoreAllMocks();
    resetMockSettings();
  });

  describe("describeSources", () => {
    it("names the categories, books, homebrew and monster types a monster search covered", () => {
      const params = {
        excludedCategories: [...allExcludedWhenAllIncluded, 24],
        sources: [2, 3],
        homebrew: true,
        monsterTypes: [4, 5, 6],
      };
      expect(DDBProxyCacheSettings.describeSources("monsters", params))
        .toBe("Categories: Core Rules (2014), Core Rules (2024) · Books: PHB, MM · with homebrew · 3 monster types");
    });

    it("describes a class munch run by the categories of its books", () => {
      expect(DDBProxyCacheSettings.describeSources("mule-stream", { sources: [2, 3], includeOptionalClassFeatures: true }))
        .toBe("Categories: Core Rules (2014) (2 books) · optional class features");
      expect(DDBProxyCacheSettings.describeSources("mule-stream", { sources: [1, 2, 148, 145], includeHomebrew: true, onlyHomebrew: true }))
        .toBe("Homebrew only");
    });

    it("has nothing to add for spells or subclasses", () => {
      expect(DDBProxyCacheSettings.describeSources("spells", { className: "Wizard" })).toBeNull();
      expect(DDBProxyCacheSettings.describeSources("subclasses", { className: "Wizard" })).toBeNull();
    });
  });

  describe("evaluate", () => {
    it("matches a monster search made with the current categories and flags, whatever its term", () => {
      const params = {
        search: "dragon", searchTerm: "dragon", exactMatch: false, excludeLegacy: false,
        excludedCategories: allExcludedWhenAllIncluded, sources: [], homebrew: false, homebrewOnly: false, monsterTypes: [],
      };
      expect(DDBProxyCacheSettings.evaluate("monsters", params)).toEqual({ supported: true, matches: true, adoptable: false, differences: [] });
    });

    it("explains each monster setting that differs", () => {
      const params = {
        excludedCategories: [...allExcludedWhenAllIncluded, 24], sources: [2], homebrew: true, homebrewOnly: false,
        exactMatch: true, excludeLegacy: false, monsterTypes: [4],
      };
      const result = DDBProxyCacheSettings.evaluate("monsters", params);
      expect(result.supported).toBe(true);
      expect(result.matches).toBe(false);
      expect(result.differences).toEqual([
        "categories: settings have Expanded Rules (2014)",
        "books: entry has PHB",
        "homebrew: on (now off)",
        "exact match: on (now off)",
        "monster types: entry has type 4",
      ]);
    });

    it("compares spells, items and lists on the campaign only", () => {
      expect(DDBProxyCacheSettings.evaluate("spells", { className: "Wizard", campaignId: "" }).matches).toBe(true);
      expect(DDBProxyCacheSettings.evaluate("mule-list", { type: "feat", campaignId: null }).matches).toBe(true);
      const other = DDBProxyCacheSettings.evaluate("items", { campaignId: "123" });
      expect(other.matches).toBe(false);
      expect(other.differences).toEqual(["campaign: 123 (now none)"]);
    });

    it("matches a class munch run that the current selection would issue", () => {
      const optionSources = Array.from(DDBSources.getChosenSourceIdSet());
      const official = {
        element: "class", systemRules: "2024", include2014Adjusted: true, includeOptionalClassFeatures: false,
        sources: [2, 3], optionSources, includeHomebrew: false,
      };
      expect(DDBProxyCacheSettings.evaluate("mule-stream", official).matches).toBe(true);

      expect(DDBProxyCacheSettings.evaluate("mule-stream", { ...official, sources: [2] }).matches).toBe(true);
      const stale = DDBProxyCacheSettings.evaluate("mule-stream", { ...official, sources: [2, 67] });
      expect(stale.differences).toEqual([
        "books: PHB, TCE (Core Rules (2014), Expanded Rules (2014)) is not one of the runs the current selection makes",
      ]);
      expect(stale.adoptable).toBe(false);

      const homebrew = DDBProxyCacheSettings.evaluate("mule-stream", { ...official, sources: [1, 2, 148, 145], includeHomebrew: true, onlyHomebrew: false });
      expect(homebrew.differences).toEqual(["fetch homebrew: on (now off)"]);
    });

    it("tells the world's rules version apart from the muncher's import choice", () => {
      const optionSources = Array.from(DDBSources.getChosenSourceIdSet());
      const base = { element: "class", includeOptionalClassFeatures: false, sources: [2, 3], optionSources, includeHomebrew: false };

      // a modern world importing 2014 classes: the muncher setting can bring this back
      const legacyImport = DDBProxyCacheSettings.evaluate("mule-stream", { ...base, systemRules: "2024", include2014Adjusted: false });
      expect(legacyImport.differences).toEqual(["import rules: 2014 (now 2024)"]);
      expect(legacyImport.adoptable).toBe(false);
      setMockSettings({ "munching-policy-character-class-rules-version": "2014" });
      expect(DDBProxyCacheSettings.evaluate("mule-stream", { ...base, systemRules: "2024", include2014Adjusted: false }).matches).toBe(true);

      // an entry made under the legacy world setting is out of the muncher's reach
      const legacyWorld = DDBProxyCacheSettings.evaluate("mule-stream", { ...base, systemRules: "2014", include2014Adjusted: false });
      expect(legacyWorld.differences).toEqual(["system rules: 2014 (the world is now 2024)"]);
      expect(legacyWorld.adoptable).toBe(false);
    });

    it("has no opinion on subclass lists or by-id records", () => {
      expect(DDBProxyCacheSettings.evaluate("subclasses", { className: "Fighter" })).toEqual({ supported: false, matches: false, adoptable: false, differences: [] });
      expect(DDBProxyCacheSettings.evaluate("monster-id", { id: 1 }).supported).toBe(false);
    });
  });

  describe("searchTermOf", () => {
    it("returns the term for monster and vehicle searches and nothing for other domains", () => {
      expect(DDBProxyCacheSettings.searchTermOf("monsters", { search: " dragon " })).toBe("dragon");
      expect(DDBProxyCacheSettings.searchTermOf("vehicles", {})).toBe("");
      expect(DDBProxyCacheSettings.searchTermOf("spells", { search: "fire" })).toBeNull();
    });
  });

  describe("captured mule selection", () => {

    it("matches the captured category run including an omitted core book", () => {
      setMockSettings({
        "munching-policy-use-source-filter": true,
        "munching-policy-muncher-sources": [3, 67],
        "munching-policy-muncher-included-source-categories": [1, 24],
      });
      const params = {
        element: "class", systemRules: "2024", include2014Adjusted: true,
        includeOptionalClassFeatures: false, includeHomebrew: false,
        sources: [3], optionSources: Array.from(DDBSources.getChosenSourceIdSet()),
      };
      const selection = DDBProxyCacheSettings.captureMuleSelection(params);
      expect(selection).toEqual({ categories: [1, 24], books: [3, 67], runSources: [3] });
      expect(DDBProxyCacheSettings.evaluate("mule-stream", params, selection).matches).toBe(true);

      // Adding PHB changes the run but not optionSources, which always contains the core books.
      setMockSettings({ "munching-policy-muncher-sources": [2, 3, 67] });
      expect(DDBProxyCacheSettings.evaluate("mule-stream", params, selection).matches).toBe(false);
      setMockSettings({ "munching-policy-muncher-sources": [3, 67] });
      expect(DDBProxyCacheSettings.evaluate("mule-stream", params, selection).matches).toBe(true);
    });

    it("matches a captured homebrew run only with the same sources and homebrew settings", () => {
      const params = {
        element: "class", systemRules: "2024", include2014Adjusted: true,
        includeOptionalClassFeatures: false, includeHomebrew: true, onlyHomebrew: true,
        sources: [1, 2, 148, 145], optionSources: Array.from(DDBSources.getChosenSourceIdSet()),
      };
      const selection = DDBProxyCacheSettings.captureMuleSelection(params);
      expect(selection?.runSources).toBeUndefined();
      setMockSettings({ "munching-policy-muncher-included-source-categories": [26] });
      expect(DDBProxyCacheSettings.evaluate("mule-stream", params, selection).matches).toBe(false);
      setMockSettings({
        "munching-policy-muncher-included-source-categories": [1, 24, 26],
        "munching-policy-character-fetch-homebrew": true,
        "munching-policy-character-only-homebrew": true,
      });
      expect(DDBProxyCacheSettings.evaluate("mule-stream", params, selection).matches).toBe(true);
    });

    it("requires an exact category run for non-class entries", () => {
      const params = {
        element: "feat", systemRules: "2024", include2014Adjusted: true,
        includeOptionalClassFeatures: false, includeHomebrew: false,
        sources: [2], optionSources: Array.from(DDBSources.getChosenSourceIdSet()),
      };
      expect(DDBProxyCacheSettings.captureMuleSelection(params)).toBeUndefined();
      expect(DDBProxyCacheSettings.evaluate("mule-stream", params).matches).toBe(false);
    });

  });

  describe("adopt", () => {
    it("rewrites the monster settings to match an entry", async () => {
      const setSetting = vi.spyOn(Utils, "setSetting").mockResolvedValue(undefined as never);
      const categories = vi.spyOn(DDBSources, "updateIncludedCategories").mockResolvedValue();
      const books = vi.spyOn(DDBSources, "updateSelectedSources").mockResolvedValue();
      const types = vi.spyOn(DDBSources, "updateSelectedMonsterTypes").mockResolvedValue();

      const applied = await DDBProxyCacheSettings.adopt("monsters", {
        excludedCategories: [...allExcludedWhenAllIncluded, 24], sources: [3, 2], homebrew: true, homebrewOnly: false, exactMatch: true, monsterTypes: [4],
      });

      expect(applied).toBe(true);
      expect(categories).toHaveBeenCalledWith([1, 26]);
      expect(books).toHaveBeenCalledWith([2, 3]);
      expect(types).toHaveBeenCalledWith([4]);
      expect(setSetting.mock.calls).toEqual([
        ["munching-policy-use-source-filter", true],
        ["munching-policy-monster-homebrew", true],
        ["munching-policy-monster-homebrew-only", false],
        ["munching-policy-monster-exact-match", true],
      ]);
    });

    it("turns the book filter off when the entry used every book", async () => {
      const setSetting = vi.spyOn(Utils, "setSetting").mockResolvedValue(undefined as never);
      vi.spyOn(DDBSources, "updateIncludedCategories").mockResolvedValue();
      const books = vi.spyOn(DDBSources, "updateSelectedSources").mockResolvedValue();
      await DDBProxyCacheSettings.adopt("vehicles", { excludedCategories: allExcludedWhenAllIncluded, sources: [], exactMatch: false });
      expect(books).not.toHaveBeenCalled();
      expect(setSetting.mock.calls).toEqual([
        ["munching-policy-use-source-filter", false],
        ["munching-policy-monster-exact-match", false],
      ]);
    });

    it("sets the campaign for spells and items", async () => {
      const setSetting = vi.spyOn(Utils, "setSetting").mockResolvedValue(undefined as never);
      await DDBProxyCacheSettings.adopt("spells", { campaignId: "123" });
      await DDBProxyCacheSettings.adopt("items", { campaignId: null });
      expect(setSetting.mock.calls).toEqual([["campaign-id", "123"], ["campaign-id", ""]]);
    });

    it.each(["mule-stream", "mule-list", "subclasses"] as const)("never adopts %s entries", async (domain) => {
      const setSetting = vi.spyOn(Utils, "setSetting");
      const params = { element: "class", systemRules: "2024", include2014Adjusted: false, campaignId: "123" };
      expect(DDBProxyCacheSettings.evaluate(domain, params).adoptable).toBe(false);
      expect(await DDBProxyCacheSettings.adopt(domain, params)).toBe(false);
      expect(setSetting).not.toHaveBeenCalled();
    });

    it("declines domains with no settings mapping", async () => {
      expect(await DDBProxyCacheSettings.adopt("monster-id", { id: 1 })).toBe(false);
    });
  });
});
