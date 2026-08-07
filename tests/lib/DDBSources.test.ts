import { setMockSettings } from "../_setup/foundryMocks";
import DDBSources from "../../src/lib/DDBSources";

// The test setup populates CONFIG.DDB with the real shipped fallback config,
// so these tests use real source names and ids:
//   BR (1), PHB (2), DMG (3), MM (5), PHB-2024 (145), br-2024 (148), Core (198)

function makeSource(sourceId: number, sourceType = 1, pageNumber: number | null = null): IDDBSource {
  return { sourceId, sourceType, pageNumber };
}

describe("DDBSources.getSource", () => {
  it("finds a source by book code", () => {
    const source = DDBSources.getSource("PHB");
    expect(source?.id).toBe(2);
    expect(source?.sourceCategoryId).toBe(26);
  });

  it("is case insensitive", () => {
    expect(DDBSources.getSource("phb-2024")?.id).toBe(145);
  });

  it("returns null for an unknown code", () => {
    expect(DDBSources.getSource("NOT-A-BOOK")).toBeNull();
  });
});

describe("DDBSources.getBookName", () => {
  it("returns the description for legacy and 2024 books", () => {
    expect(DDBSources.getBookName("PHB")).toBe("Player’s Handbook (2014)");
    expect(DDBSources.getBookName("PHB-2024")).toBe("Player’s Handbook");
  });

  it("returns an empty string for an unknown code", () => {
    expect(DDBSources.getBookName("NOT-A-BOOK")).toBe("");
  });
});

describe("DDBSources.getBookId", () => {
  it("returns the DDB id for a known book", () => {
    expect(DDBSources.getBookId("MM")).toBe(5);
  });

  it("returns null for an unknown book", () => {
    expect(DDBSources.getBookId("NOT-A-BOOK")).toBeNull();
  });
});

describe("DDBSources.is2014Source / is2024Source", () => {
  it("treats ids below 145 as 2014", () => {
    expect(DDBSources.is2014Source(makeSource(2))).toBe(true);
    expect(DDBSources.is2024Source(makeSource(2))).toBe(false);
  });

  it("treats ids of 145 and above as 2024", () => {
    expect(DDBSources.is2024Source(makeSource(145))).toBe(true);
    expect(DDBSources.is2014Source(makeSource(145))).toBe(false);
  });

  it("forces listed high ids back to 2014", () => {
    // 150 is in DICTIONARY.source.is2014 despite being >= 145
    expect(DDBSources.is2014Source(makeSource(150))).toBe(true);
    expect(DDBSources.is2024Source(makeSource(150))).toBe(false);
  });

  it("forces Homebrew (9999999) to 2014", () => {
    expect(DDBSources.is2014Source(makeSource(9999999))).toBe(true);
  });

  it("honours the forced 2024 list", () => {
    expect(DDBSources.is2024Source(makeSource(196))).toBe(true);
    expect(DDBSources.is2014Source(makeSource(196))).toBe(false);
  });
});

describe("DDBSources.getAdjustedSourceBook", () => {
  it("maps basic rules codes to PHB 2024 / SRD 5.1 when basic rules are disabled", () => {
    setMockSettings({ "use-basic-rules": false });
    expect(DDBSources.getAdjustedSourceBook("free-rules")).toBe("PHB 2024");
    expect(DDBSources.getAdjustedSourceBook("br-2024")).toBe("PHB 2024");
    expect(DDBSources.getAdjustedSourceBook("BR-2024")).toBe("PHB 2024");
    expect(DDBSources.getAdjustedSourceBook("BR")).toBe("SRD 5.1");
  });

  it("keeps basic rules codes when basic rules are enabled", () => {
    setMockSettings({ "use-basic-rules": true });
    expect(DDBSources.getAdjustedSourceBook("BR")).toBe("BR");
    // only the dash is swapped, br-2024 is not remapped
    expect(DDBSources.getAdjustedSourceBook("br-2024")).toBe("br 2024");
  });

  it("replaces the first dash with a space for regular books", () => {
    setMockSettings({ "use-basic-rules": false });
    expect(DDBSources.getAdjustedSourceBook("PHB-2024")).toBe("PHB 2024");
    expect(DDBSources.getAdjustedSourceBook("MM")).toBe("MM");
  });
});

describe("DDBSources.getChosenSourceIdSet", () => {
  // PHB (2) sits in category 26, the Kobold Press Northlands books (238, 239) in category 21
  const chooseCategories = (overrides: Record<string, unknown> = {}) => {
    setMockSettings({
      "munching-policy-muncher-included-source-categories": [26, 21],
      "munching-policy-use-source-filter": false,
      "munching-policy-muncher-sources": [],
      ...overrides,
    });
  };

  it("includes every book of the chosen categories when no source filter is used", () => {
    chooseCategories();
    const ids = DDBSources.getChosenSourceIdSet();
    expect(ids.has(2)).toBe(true);
    expect(ids.has(238)).toBe(true);
    expect(ids.has(239)).toBe(true);
  });

  it("always seeds the core books", () => {
    chooseCategories({ "munching-policy-muncher-included-source-categories": [] });
    const ids = DDBSources.getChosenSourceIdSet();
    expect([...ids].sort((a, b) => a - b)).toEqual([1, 2, 145, 148]);
  });

  it("honours the source filter selection", () => {
    chooseCategories({
      "munching-policy-use-source-filter": true,
      "munching-policy-muncher-sources": [2],
    });
    const ids = DDBSources.getChosenSourceIdSet();
    expect(ids.has(2)).toBe(true);
    expect(ids.has(238)).toBe(false);
    expect(ids.has(239)).toBe(false);
  });

  it("can skip the core books and ignore the filter override", () => {
    chooseCategories({
      "munching-policy-use-source-filter": true,
      "munching-policy-muncher-sources": [2],
    });
    expect(DDBSources.getChosenSourceIdSet({ includeCore: false })).toEqual(new Set([2]));
    expect(DDBSources.getChosenSourceIdSet({ includeCore: false, useOverride: false }).has(238)).toBe(true);
  });
});

describe("DDBSources.isDefinitionInSourceIds", () => {
  it("matches when any source is allowed", () => {
    const definition: IDDBSourcesDefinition = { sources: [makeSource(238), makeSource(2)] };
    expect(DDBSources.isDefinitionInSourceIds(definition, new Set([2]))).toBe(true);
  });

  it("rejects definitions from other sources", () => {
    const definition: IDDBSourcesDefinition = { sources: [makeSource(238)] };
    expect(DDBSources.isDefinitionInSourceIds(definition, new Set([2]))).toBe(false);
    expect(DDBSources.isDefinitionInSourceIds(definition, [2])).toBe(false);
  });

  it("allows definitions without source data unless told not to", () => {
    expect(DDBSources.isDefinitionInSourceIds({}, [2])).toBe(true);
    expect(DDBSources.isDefinitionInSourceIds({ sources: [] }, [2])).toBe(true);
    expect(DDBSources.isDefinitionInSourceIds({}, [2], { allowMissingSources: false })).toBe(false);
  });
});

describe("DDBSources.groupByPrimarySourceId", () => {
  const entry = (name: string, sourceIds: number[]) => ({
    name,
    definition: { name, sources: sourceIds.map((id) => makeSource(id)) },
  });

  it("buckets entries by their first source", () => {
    const grouped = DDBSources.groupByPrimarySourceId(
      [entry("Fireball", [2]), entry("Shield", [2]), entry("Toll the Dead", [3])],
      (spell) => spell.definition,
    );
    expect([...grouped.keys()].sort()).toEqual([2, 3]);
    expect(grouped.get(2)?.map((spell) => spell.name)).toEqual(["Fireball", "Shield"]);
    expect(grouped.get(3)?.map((spell) => spell.name)).toEqual(["Toll the Dead"]);
  });

  it("keeps buckets disjoint for a reprinted entry", () => {
    const grouped = DDBSources.groupByPrimarySourceId([entry("Fireball", [2, 145])], (spell) => spell.definition);
    expect([...grouped.keys()]).toEqual([2]);
    expect(grouped.get(145)).toBeUndefined();
  });

  it("collects entries with no source data instead of dropping them", () => {
    const grouped = DDBSources.groupByPrimarySourceId(
      [entry("Homebrew Bolt", []), { name: "No definition", definition: undefined }],
      (spell) => spell.definition,
    );
    expect(grouped.get(DDBSources.UNKNOWN_SOURCE_ID)?.map((spell) => spell.name))
      .toEqual(["Homebrew Bolt", "No definition"]);
  });

  it("round trips every entry exactly once", () => {
    const entries = [entry("A", [2]), entry("B", [2, 3]), entry("C", [3]), entry("D", [])];
    const grouped = DDBSources.groupByPrimarySourceId(entries, (spell) => spell.definition);
    expect([...grouped.values()].flat()).toHaveLength(entries.length);
  });
});

describe("DDBSources.getPrimarySource", () => {
  it("prefers the real book over reprint and reference entries", () => {
    const definition: IDDBSourcesDefinition = {
      sources: [makeSource(238, 2), makeSource(2, 1), makeSource(145, 1)],
    };
    expect(DDBSources.getPrimarySource(definition)?.sourceId).toBe(2);
  });

  it("falls back to the first entry when nothing is typed as a book", () => {
    expect(DDBSources.getPrimarySource({ sources: [makeSource(238, 2)] })?.sourceId).toBe(238);
  });

  it("returns null when there is no source data", () => {
    expect(DDBSources.getPrimarySource({ sources: [] })).toBeNull();
    expect(DDBSources.getPrimarySource({})).toBeNull();
    expect(DDBSources.getPrimarySource(null)).toBeNull();
  });
});

describe("DDBSources.getSourceCategoryForSourceId", () => {
  it("resolves a source id to its category", () => {
    // PHB (2) sits in category 26, PHB-2024 (145) in the 2024 core category
    const phb = DDBSources.getSourceCategoryForSourceId(2);
    expect(phb?.id).toBe(26);
    expect(typeof phb?.name).toBe("string");
  });

  it("returns null for an unknown source id", () => {
    expect(DDBSources.getSourceCategoryForSourceId(99999)).toBeNull();
  });
});

describe("DDBSources.getDDBSourceBook", () => {
  it("maps SRD 5.1 back to BR", () => {
    expect(DDBSources.getDDBSourceBook("SRD 5.1")).toBe("BR");
  });

  it("replaces only the first space with a dash", () => {
    expect(DDBSources.getDDBSourceBook("PHB 2024")).toBe("PHB-2024");
    // characterization: String.replace only touches the first space
    expect(DDBSources.getDDBSourceBook("A B C")).toBe("A-B C");
  });
});

describe("DDBSources.tweakSourceData", () => {
  it("returns early when book is undefined", () => {
    const source = { book: undefined, page: "12", license: "", custom: "", rules: null };
    DDBSources.tweakSourceData(source);
    expect(source.book).toBeUndefined();
    expect(source.page).toBe("12");
  });

  it("licenses BR as CC-BY-4.0 when basic rules are enabled", () => {
    setMockSettings({ "use-basic-rules": true, "no-source-book-pages": false });
    const source = { book: "BR", page: "70", license: "", custom: "", rules: null };
    DDBSources.tweakSourceData(source);
    expect(source.book).toBe("BR");
    expect(source.license).toBe("CC-BY-4.0");
    expect(source.page).toBe("70");
  });

  it("renames BR to SRD 5.1 without a license when basic rules are disabled", () => {
    setMockSettings({ "use-basic-rules": false, "no-source-book-pages": false });
    const source = { book: "BR", page: "70", license: "", custom: "", rules: null };
    DDBSources.tweakSourceData(source);
    expect(source.book).toBe("SRD 5.1");
    expect(source.license).toBe("");
  });

  it("clears the page when no-source-book-pages is set", () => {
    setMockSettings({ "use-basic-rules": false, "no-source-book-pages": true });
    const source = { book: "PHB", page: "42", license: "", custom: "", rules: null };
    DDBSources.tweakSourceData(source);
    expect(source.page).toBe("");
  });
});

describe("DDBSources.getSourceData", () => {
  beforeEach(() => {
    setMockSettings({ "use-basic-rules": false, "no-source-book-pages": false });
  });

  it("resolves a type one source with a page", () => {
    const definition: IDDBSourcesDefinition = { sources: [makeSource(2, 1, 42)] };
    const result = DDBSources.getSourceData(definition);
    expect(result).toHaveLength(1);
    expect(result[0].book).toBe("PHB");
    expect(result[0].page).toBe("42");
    expect(result[0].id).toBe(2);
    expect(result[0].categoryId).toBe(26);
  });

  it("falls back to Homebrew for an unknown source id", () => {
    const definition: IDDBSourcesDefinition = { sources: [makeSource(424242, 1, 1)] };
    const result = DDBSources.getSourceData(definition);
    expect(result[0].book).toBe("Homebrew");
    expect(result[0].id).toBe(9999999);
    expect(result[0].categoryId).toBe(9999999);
  });

  it("maps an SRD-only source to SRD 5.1 and mutates the definition", () => {
    const definition: IDDBSourcesDefinition = { sources: [makeSource(1, 1, null)] };
    const result = DDBSources.getSourceData(definition);
    expect(result).toHaveLength(1);
    expect(result[0].book).toBe("SRD 5.1");
    expect(result[0].id).toBe(1);
    // characterization: the SRD special case pushes a PHB source into the
    // caller's definition.sources array (input mutation)
    expect(definition.sources).toHaveLength(2);
    expect(definition.sources?.[1].sourceId).toBe(2);
  });

  it("resolves each entry of a sourceIds definition", () => {
    const definition: IDDBSourceIdsDefinition = { sourceIds: [2, 5] };
    const result = DDBSources.getSourceData(definition);
    expect(result.map((r) => r.book)).toEqual(["PHB", "MM"]);
    expect(result.map((r) => r.page)).toEqual(["", ""]);
  });

  it("resolves a single sourceId definition with its page", () => {
    const definition: IDDBSourcesDefinition = { sourceId: 3, sourcePageNumber: "12" };
    const result = DDBSources.getSourceData(definition);
    expect(result).toHaveLength(1);
    expect(result[0].book).toBe("DMG");
    expect(result[0].page).toBe("12");
  });

  it("returns a Homebrew entry for isHomebrew definitions", () => {
    const definition: IDDBBaseSourcesDefinition = { isHomebrew: true };
    const result = DDBSources.getSourceData(definition);
    expect(result).toEqual([
      { book: "Homebrew", page: "", license: "", custom: "", id: 9999999, categoryId: 9999999, rules: null },
    ]);
  });

  it("returns an empty array when there is no source information", () => {
    expect(DDBSources.getSourceData({})).toEqual([]);
  });
});

describe("DDBSources.parseSource", () => {
  beforeEach(() => {
    setMockSettings({ "use-basic-rules": false, "no-source-book-pages": false });
  });

  it("picks the source with the highest id and strips the id", () => {
    const definition: IDDBSourcesDefinition = {
      sources: [makeSource(2, 1, 4), makeSource(145, 1, 30)],
    };
    const result = DDBSources.parseSource(definition);
    expect(result.book).toBe("PHB 2024");
    expect(result.page).toBe("30");
    expect("id" in result).toBe(false);
    // characterization: only id is deleted, categoryId survives
    expect(result.categoryId).toBe(24);
  });

  it("falls back to Homebrew when no sources resolve", () => {
    expect(DDBSources.parseSource({})).toEqual({
      book: "Homebrew",
      page: "",
      license: "",
      custom: "",
      rules: null,
    });
  });
});
