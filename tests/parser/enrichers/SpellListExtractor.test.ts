// @vitest-environment jsdom
/**
 * SpellListExtractor builds a subclass spell list from a feature's spell table. Features routed to
 * it without a table of their own (Maverick Spells, Circle of the Land Spells, Vestige Spells) have
 * no list to build and must be skipped quietly rather than logged as errors.
 */
import SpellListExtractor from "../../../src/parser/enrichers/data/SpellListExtractor";
import logger from "../../../src/lib/Logger";

const TABLE = `<p>You always have these spells prepared.</p>
<table><thead><tr><th>Level</th><th>Spells</th></tr></thead>
<tbody><tr><td>3rd</td><td>Bless, Cure Wounds</td></tr><tr><td>5th</td><td>Aid</td></tr></tbody></table>`;

afterEach(() => vi.restoreAllMocks());

describe("SpellListExtractor", () => {
  it("skips a feature with no spell table without an error or the spell list factory", async () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    const api = (globalThis as any).DDBImporter;
    // reaching the factory would throw on this getter
    Object.defineProperty(globalThis, "DDBImporter", {
      configurable: true,
      get: () => {
        throw new Error("spell list factory reached");
      },
    });
    try {
      const extractor = new SpellListExtractor({
        name: "Maverick Spells",
        description: "<p>You learn one cantrip of your choice from the Artificer, Cleric, or Wizard spell list.</p>",
      });
      await expect(extractor.generateSpellList("subclass")).resolves.toBeUndefined();
    } finally {
      Object.defineProperty(globalThis, "DDBImporter", { configurable: true, writable: true, value: api });
    }
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("reads the spells column of a spell table, by level when asked", () => {
    const extractor = new SpellListExtractor({ name: "Life Domain Spells", description: TABLE });
    expect(extractor.extractSpells()).toEqual(["Bless", "Cure Wounds", "Aid"]);
    expect(extractor.extractSpells(true)).toEqual({ 3: ["Bless", "Cure Wounds"], 5: ["Aid"] });
  });

  it("drops footnote asterisks and non-breaking spaces from spell names", () => {
    const description = `<table><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>
      <tr><td>3</td><td>Command, Comprehend Languages*, Detect Magic*</td></tr>
      <tr><td>5</td><td>Enhance Ability, Hangover&nbsp; *</td></tr></tbody></table>`;
    const extractor = new SpellListExtractor({ name: "Knowledge Domain Spells", description });
    expect(extractor.extractSpells()).toEqual(["Command", "Comprehend Languages", "Detect Magic", "Enhance Ability", "Hangover"]);
  });

  it("keeps a qualifier with commas of its own on its spell", () => {
    const description = `<table><thead><tr><th>Level</th><th>Spells</th></tr></thead><tbody>
      <tr><td>5</td><td>Conjure Animals (bats, rats, or wolves only), Vampiric Touch</td></tr></tbody></table>`;
    const extractor = new SpellListExtractor({ name: "First Vampire Spells", description });
    expect(extractor.extractSpells()).toEqual(["Conjure Animals (bats, rats, or wolves only)", "Vampiric Touch"]);
  });
});
