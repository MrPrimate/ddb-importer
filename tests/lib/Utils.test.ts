// Mock barrel re-exports to break circular dependency chains:
// Utils → config/_module → settings → lib/_module → DDBSources → config/_module (DICTIONARY not ready)
// lib/_module → DDBItemImporter → effects/_module → DDBEffectHelper (more circular refs)
vi.mock("../../src/config/_module", () => ({
  SETTINGS: { MODULE_ID: "ddb-importer" },
  DICTIONARY: { sourceCategories: { excluded: [], hidden: [], legacy: [], basicRules: [] } },
}));

import Utils from "../../src/lib/Utils";

describe("Utils.capitalize", () => {
  it("capitalizes the first letter", () => {
    expect(Utils.capitalize("hello")).toBe("Hello");
  });

  it("returns empty string for non-string input", () => {
    expect(Utils.capitalize(42 as any)).toBe("");
  });

  it("handles empty string", () => {
    expect(Utils.capitalize("")).toBe("");
  });

  it("handles already capitalized", () => {
    expect(Utils.capitalize("Hello")).toBe("Hello");
  });
});

describe("Utils.normalizeString", () => {
  it("lowercases and strips non-word chars", () => {
    expect(Utils.normalizeString("Hello World!")).toBe("helloworld");
  });

  it("handles special characters", () => {
    expect(Utils.normalizeString("Fire Bolt (Cantrip)")).toBe("fireboltcantrip");
  });

  it("handles empty string", () => {
    expect(Utils.normalizeString("")).toBe("");
  });
});

describe("Utils.idString", () => {
  it("strips non-alphanumeric characters", () => {
    expect(Utils.idString("Hello World!")).toBe("HelloWorld");
  });

  it("preserves numbers", () => {
    expect(Utils.idString("Level 3 Spell")).toBe("Level3Spell");
  });

  it("handles empty string", () => {
    expect(Utils.idString("")).toBe("");
  });
});

describe("Utils.pascalCase", () => {
  it("converts space-separated words to PascalCase", () => {
    expect(Utils.pascalCase("hello world")).toBe("HelloWorld");
  });

  it("handles single word", () => {
    expect(Utils.pascalCase("hello")).toBe("Hello");
  });

  it("strips non-alphanumeric within words", () => {
    expect(Utils.pascalCase("fire bolt")).toBe("FireBolt");
  });
});

describe("Utils.camelCase", () => {
  it("converts space-separated words to camelCase", () => {
    expect(Utils.camelCase("hello world")).toBe("helloWorld");
  });

  it("handles single word", () => {
    expect(Utils.camelCase("hello")).toBe("hello");
  });
});

describe("Utils.nameString", () => {
  it("decodes HTML entities", () => {
    expect(Utils.nameString("Fire &amp; Ice")).toBe("Fire & Ice");
  });

  it("decodes nbsp", () => {
    expect(Utils.nameString("Hello&nbsp;World")).toBe("Hello World");
  });

  it("decodes accented characters", () => {
    expect(Utils.nameString("caf&eacute;")).toBe("café");
  });

  it("removes shy hyphens", () => {
    expect(Utils.nameString("long&shy;word")).toBe("longword");
  });

  it("converts mdash and ndash", () => {
    expect(Utils.nameString("A&mdash;B")).toBe("A-B");
    expect(Utils.nameString("A&ndash;B")).toBe("A-B");
  });

  it("converts smart quotes", () => {
    expect(Utils.nameString("&ldquo;hello&rdquo;")).toBe("\"hello\"");
  });

  it("trims and collapses double spaces", () => {
    expect(Utils.nameString("  hello  world  ")).toBe("hello world");
  });
});

describe("Utils.referenceNameString", () => {
  it("produces a slugified identifier", () => {
    const result = Utils.referenceNameString("Fire Bolt");
    expect(result).toBe("fire-bolt");
  });

  it("strips apostrophes before slugifying", () => {
    const result = Utils.referenceNameString("Witch's Hex");
    expect(result).toBe("witchs-hex");
  });

  it("converts backslash/forward slash to hyphen", () => {
    const result = Utils.referenceNameString("Str/Dex");
    expect(result).toBe("str-dex");
  });
});

describe("Utils.regexSanitizeString", () => {
  it("escapes regex special characters", () => {
    const result = Utils.regexSanitizeString("Hello (World) [Test]");
    expect(result).toBe("Hello \\(World\\) \\[Test\\]");
  });

  it("preserves alphanumeric and spaces", () => {
    expect(Utils.regexSanitizeString("Hello World")).toBe("Hello World");
  });
});

describe("Utils.namedIDStub", () => {
  it("generates a 16-char ID stub by default", () => {
    const result = Utils.namedIDStub("Fire Bolt");
    expect(result.length).toBe(16);
    expect(result.startsWith("ddb")).toBe(true);
  });

  it("respects custom prefix", () => {
    const result = Utils.namedIDStub("Test", { prefix: "abc" });
    expect(result.startsWith("abc")).toBe(true);
    expect(result.length).toBe(16);
  });

  it("respects custom postfix", () => {
    const result = Utils.namedIDStub("Test", { postfix: "XY" });
    expect(result).toContain("XY");
    expect(result.length).toBe(16);
  });

  it("pads with I if name is too short", () => {
    const result = Utils.namedIDStub("A", { prefix: "ddb", length: 16 });
    expect(result.length).toBe(16);
    expect(result).toMatch(/I+$/);
  });

  it("handles multi-word names", () => {
    const result = Utils.namedIDStub("Eldritch Blast Extra");
    expect(result.length).toBe(16);
  });
});

describe("Utils.arrayRange", () => {
  it("generates range from 0", () => {
    expect(Utils.arrayRange(5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("generates range with step", () => {
    expect(Utils.arrayRange(3, 2)).toEqual([0, 2, 4]);
  });

  it("generates range with offset", () => {
    expect(Utils.arrayRange(3, 1, 10)).toEqual([10, 11, 12]);
  });

  it("returns empty array for 0 total", () => {
    expect(Utils.arrayRange(0)).toEqual([]);
  });
});

describe("Utils.removeCompendiumLinks", () => {
  it("removes tagged compendium links preserving tag text", () => {
    const input = "@Compendium[dnd5e.spells.fireball]{Fireball}";
    expect(Utils.removeCompendiumLinks(input)).toBe("{Fireball}");
  });

  it("removes untagged compendium links preserving content", () => {
    const input = "@Compendium[dnd5e.spells.fireball]";
    expect(Utils.removeCompendiumLinks(input)).toBe("dnd5e.spells.fireball");
  });
});

describe("Utils.calculateModifier", () => {
  it("calculates D&D ability modifier correctly", () => {
    expect(Utils.calculateModifier(10)).toBe(0);
    expect(Utils.calculateModifier(11)).toBe(0);
    expect(Utils.calculateModifier(12)).toBe(1);
    expect(Utils.calculateModifier(8)).toBe(-1);
    expect(Utils.calculateModifier(20)).toBe(5);
    expect(Utils.calculateModifier(1)).toBe(-5);
    expect(Utils.calculateModifier(30)).toBe(10);
  });
});

describe("Utils.versionCompare", () => {
  it("returns 0 for equal versions", () => {
    expect(Utils.versionCompare("1.0.0", "1.0.0", {})).toBe(0);
  });

  it("returns 1 when v1 > v2", () => {
    expect(Utils.versionCompare("2.0.0", "1.0.0", {})).toBe(1);
  });

  it("returns -1 when v1 < v2", () => {
    expect(Utils.versionCompare("1.0.0", "2.0.0", {})).toBe(-1);
  });

  it("compares minor versions", () => {
    expect(Utils.versionCompare("1.2.0", "1.1.0", {})).toBe(1);
  });

  it("compares patch versions", () => {
    expect(Utils.versionCompare("1.0.1", "1.0.0", {})).toBe(1);
  });

  it("handles different length versions", () => {
    expect(Utils.versionCompare("1.0.0", "1.0", {})).toBe(1);
  });

  it("handles zeroExtend option", () => {
    expect(Utils.versionCompare("1.0", "1.0.0", { zeroExtend: true })).toBe(0);
  });
});

describe("Utils.parseDiceString", () => {
  it("parses simple dice", () => {
    const result = Utils.parseDiceString("1d8");
    expect(result.diceMap).toHaveLength(1);
    expect(result.diceMap[0]).toEqual({ sign: "+", count: 1, die: 8 });
    expect(result.bonus).toBe(0);
  });

  it("parses dice with bonus", () => {
    const result = Utils.parseDiceString("2d6+3");
    expect(result.diceMap).toHaveLength(1);
    expect(result.diceMap[0]).toEqual({ sign: "+", count: 2, die: 6 });
    expect(result.bonus).toBe(3);
  });

  it("parses mixed dice", () => {
    const result = Utils.parseDiceString("1d8+1d6");
    expect(result.diceMap).toHaveLength(2);
    expect(result.bonus).toBe(0);
  });

  it("groups same dice with same sign", () => {
    const result = Utils.parseDiceString("1d8+2d8");
    expect(result.diceMap).toHaveLength(1);
    expect(result.diceMap[0].count).toBe(3);
  });

  it("handles negative bonus", () => {
    const result = Utils.parseDiceString("1d6-2");
    expect(result.bonus).toBe(-2);
  });

  it("handles negative dice", () => {
    const result = Utils.parseDiceString("2d8-1d6");
    expect(result.diceMap).toHaveLength(2);
    const d6 = result.diceMap.find((d) => d.die === 6);
    expect(d6!.sign).toBe("-");
    expect(d6!.count).toBe(-1);
  });

  it("sorts dice by die size ascending", () => {
    const result = Utils.parseDiceString("1d12+1d4+1d8");
    expect(result.diceMap[0].die).toBe(4);
    expect(result.diceMap[1].die).toBe(8);
    expect(result.diceMap[2].die).toBe(12);
  });

  it("includes mods in diceString", () => {
    const result = Utils.parseDiceString("1d8", "+@mod");
    expect(result.diceString).toContain("+@mod");
  });

  it("handles em-dash and other dash variants", () => {
    // parseDiceString normalizes various dash characters
    const result = Utils.parseDiceString("1d6\u20132"); // en-dash
    expect(result.bonus).toBe(-2);
  });
});

describe("Utils.groupBy", () => {
  it("groups array items by property", () => {
    const arr = [
      { type: "a", val: 1 },
      { type: "b", val: 2 },
      { type: "a", val: 3 },
    ];
    const result = Utils.groupBy(arr, "type");
    expect(result.get("a")).toHaveLength(2);
    expect(result.get("b")).toHaveLength(1);
  });

  it("returns empty map for empty array", () => {
    const result = Utils.groupBy([], "type");
    expect(result.size).toBe(0);
  });
});

describe("Utils type checks", () => {
  it("isObject", () => {
    expect(Utils.isObject({})).toBe(true);
    expect(Utils.isObject([])).toBe(false);
    expect(Utils.isObject(null)).toBe(false);
    expect(Utils.isObject("str")).toBe(false);
  });

  it("isString", () => {
    expect(Utils.isString("hello")).toBe(true);
    expect(Utils.isString(new String("hello"))).toBe(true);
    expect(Utils.isString(42)).toBe(false);
  });

  it("isArray", () => {
    expect(Utils.isArray([])).toBe(true);
    expect(Utils.isArray({})).toBe(false);
  });

  it("isBoolean", () => {
    expect(Utils.isBoolean(true)).toBe(true);
    expect(Utils.isBoolean(false)).toBe(true);
    expect(Utils.isBoolean(0)).toBe(false);
  });

  it("isFunction", () => {
    expect(Utils.isFunction(() => {})).toBe(true);
    expect(Utils.isFunction("notfn")).toBe(false);
  });
});

describe("Utils.mergeDeep", () => {
  it("deeply merges two objects", () => {
    const target = { a: { b: 1, c: 2 } };
    const source = { a: { b: 3, d: 4 } };
    const result = Utils.mergeDeep(target, source);
    expect(result).toEqual({ a: { b: 3, c: 2, d: 4 } });
  });

  it("does not mutate the target", () => {
    const target = { a: 1 };
    const source = { b: 2 };
    const result = Utils.mergeDeep(target, source);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(target).toEqual({ a: 1 });
  });

  it("overwrites non-object values", () => {
    const target = { a: 1 };
    const source = { a: 2 };
    expect(Utils.mergeDeep(target, source)).toEqual({ a: 2 });
  });
});

describe("Utils.filterDeprecated", () => {
  it("removes properties with _deprecated: true", () => {
    const data = {
      good: { value: 1 },
      bad: { value: 2, _deprecated: true },
    };
    const result = Utils.filterDeprecated(data);
    expect(result.good).toBeDefined();
    expect(result.bad).toBeUndefined();
  });

  it("removes top-level _deprecated flag", () => {
    const data = { _deprecated: true, value: 1 };
    Utils.filterDeprecated(data);
    expect(data._deprecated).toBeUndefined();
  });
});

describe("Utils.entityMap", () => {
  it("returns a Map", () => {
    const map = Utils.entityMap();
    expect(map).toBeInstanceOf(Map);
  });

  it("maps monster to Actor", () => {
    const map = Utils.entityMap();
    expect(map.get("monster")).toBe("Actor");
    expect(map.get("npc")).toBe("Actor");
  });

  it("maps spell to Item", () => {
    const map = Utils.entityMap();
    expect(map.get("spell")).toBe("Item");
  });

  it("maps scene to Scene", () => {
    const map = Utils.entityMap();
    expect(map.get("scene")).toBe("Scene");
  });

  it("maps journal to JournalEntry", () => {
    const map = Utils.entityMap();
    expect(map.get("journal")).toBe("JournalEntry");
  });
});

describe("Utils.replaceHtmlSpaces", () => {
  it("replaces &nbsp; with space", () => {
    expect(Utils.replaceHtmlSpaces("hello&nbsp;world")).toBe("hello world");
  });

  it("replaces non-breaking space char with space", () => {
    expect(Utils.replaceHtmlSpaces("hello\xA0world")).toBe("hello world");
  });

  it("collapses multiple spaces and trims", () => {
    expect(Utils.replaceHtmlSpaces("  hello   world  ")).toBe("hello world");
  });
});

describe("Utils.ordinalSuffixOf", () => {
  it("handles 1st", () => expect(Utils.ordinalSuffixOf(1)).toBe("1st"));
  it("handles 2nd", () => expect(Utils.ordinalSuffixOf(2)).toBe("2nd"));
  it("handles 3rd", () => expect(Utils.ordinalSuffixOf(3)).toBe("3rd"));
  it("handles 4th", () => expect(Utils.ordinalSuffixOf(4)).toBe("4th"));
  it("handles 11th", () => expect(Utils.ordinalSuffixOf(11)).toBe("11th"));
  it("handles 12th", () => expect(Utils.ordinalSuffixOf(12)).toBe("12th"));
  it("handles 13th", () => expect(Utils.ordinalSuffixOf(13)).toBe("13th"));
  it("handles 21st", () => expect(Utils.ordinalSuffixOf(21)).toBe("21st"));
  it("handles 22nd", () => expect(Utils.ordinalSuffixOf(22)).toBe("22nd"));
});

describe("Utils.stringIntAdder", () => {
  it("adds two integer strings", () => {
    expect(Utils.stringIntAdder("3", "5")).toBe("8");
  });

  it("handles signed integers", () => {
    expect(Utils.stringIntAdder("+3", "+5")).toBe("8");
  });

  it("treats leading digits in dice strings as integers (parseInt behavior)", () => {
    // parseInt("1d6") = 1, parseInt("1d4") = 1, so 1 + 1 = 2
    const result = Utils.stringIntAdder("1d6", "1d4");
    expect(result).toBe("2");
  });

  it("concatenates truly non-numeric strings", () => {
    const result = Utils.stringIntAdder("abc", "def");
    expect(result).toBe("abc + def");
  });
});

describe("Utils.addToProperties / removeFromProperties", () => {
  it("adds a value to properties array", () => {
    const result = Utils.addToProperties(["a", "b"], "c");
    expect(result).toContain("c");
    expect(result).toContain("a");
  });

  it("does not duplicate existing values", () => {
    const result = Utils.addToProperties(["a", "b"], "a");
    expect(result.filter((v) => v === "a")).toHaveLength(1);
  });

  it("removes a value from properties array", () => {
    const result = Utils.removeFromProperties(["a", "b", "c"], "b");
    expect(result).not.toContain("b");
    expect(result).toContain("a");
    expect(result).toContain("c");
  });
});

describe("Utils.addArrayToProperties / removeArrayFromProperties", () => {
  it("adds multiple values", () => {
    const result = Utils.addArrayToProperties(["a"], ["b", "c"]);
    expect(result).toEqual(expect.arrayContaining(["a", "b", "c"]));
  });

  it("removes multiple values", () => {
    const result = Utils.removeArrayFromProperties(["a", "b", "c"], ["a", "c"]);
    expect(result).toEqual(["b"]);
  });
});
