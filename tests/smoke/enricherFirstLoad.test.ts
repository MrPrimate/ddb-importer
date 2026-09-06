// No vi.mock calls on purpose, and the enricher barrel is deliberately the
// FIRST src import in this file's module registry: this pins the property that
// DDBEnricherData's transitive imports never re-enter the enricher tree while
// it is mid-evaluation. Before the leaf-import refactor this exact import died
// with "Class extends value undefined" in SpellListExtractorMixin, and every
// enricher test needed a bespoke vi.mock preamble to load at all.
import * as Enrichers from "../../src/parser/enrichers/_module";
import DDBEnricherData from "../../src/parser/enrichers/data/DDBEnricherData";

describe("enricher tree first-load smoke", () => {
  it("loads the full enricher barrel without mocks", () => {
    // class/_module nests one namespace per class
    expect(Object.keys(Enrichers.ClassEnrichers).length).toBeGreaterThan(15);
    const flattened = Object.values(Enrichers.ClassEnrichers).flatMap((ns) => Object.keys(ns as object));
    expect(flattened.length).toBeGreaterThan(100);
    expect(Enrichers.DDBSpellEnricher).toBeDefined();
    expect(Enrichers.data.SpellListExtractorMixin).toBeDefined();
  });

  it("resolves the cycle-sensitive statics on DDBEnricherData", () => {
    // these getters read live bindings from the effects barrel; undefined here
    // means the import cycle regressed
    expect(DDBEnricherData.AutoEffects).toBeDefined();
    expect(DDBEnricherData.ChangeHelper).toBeDefined();
  });
});
