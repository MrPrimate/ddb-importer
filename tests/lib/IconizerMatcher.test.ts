import { buildIconCache, normaliseIconName, resolveDocumentIcon, resolveIconMatch } from "../../src/lib/IconizerMatcher.mjs";
import { nameString } from "../../src/lib/NameNormalizer.mjs";

const entry = (name: string, path: string, monster?: string) => ({ name, path, ...(monster ? { monster } : {}) });

describe("built-in icon matching contract", () => {
  const cache = buildIconCache({
    "feats.json": [entry("Scholar's Guard", "feat"), entry("Guard", "suffix"), entry("Stance", "prefix")],
    "class-features.json": [entry("Scholar's Guard", "class"), entry("Original Power", "original"), entry("Ward", "first"), entry("Ward of Light", "second")],
    "classes.json": [entry("Wizard", "wizard")],
    "named-monster-features.json": [entry("Claw", "cat", "Cat"), entry("Claw", "duplicate", "Cat"), entry("Bite", "other", "Wolf")],
    "generic-monster-features.json": [entry("Claw", "generic"), entry("Zap", "monster-spell")],
    "spells.json": [entry("Zap", "spell")],
  });

  it("uses the same DDB entity, apostrophe and whitespace normalization", () => {
    expect(nameString("  Scholar&rsquo;s  Guard&nbsp;")).toBe("Scholar's Guard");
    expect(normaliseIconName("Scholar’s Guard")).toBe("scholar's guard");
    expect(resolveIconMatch({ name: "Scholar’s Guard", type: "feat" }, "feat", cache)).toMatchObject({
      path: "feat", file: "feats.json", entryIndex: 0, kind: "exact",
    });
  });

  it("prefers a display-name exact match over original name and the first table over later tables", () => {
    expect(resolveDocumentIcon({ name: "Scholar's Guard", type: "feat", flags: { ddbimporter: { originalName: "Original Power" } } }, cache)?.path).toBe("feat");
    expect(resolveDocumentIcon({ name: "Renamed Power", type: "feat", flags: { ddbimporter: { originalName: "Original Power" } } }, cache)?.kind).toBe("original-name");
  });

  it("tries colon suffix before prefix, then keeps historical first-entry prefix order", () => {
    expect(resolveDocumentIcon({ name: "Stance: Guard", type: "feat" }, cache)?.path).toBe("suffix");
    expect(resolveDocumentIcon({ name: "Stance: Unknown", type: "feat" }, cache)?.kind).toBe("colon-prefix");
    expect(resolveDocumentIcon({ name: "Ward of Night", type: "feat" }, cache)?.path).toBe("first");
    expect(resolveDocumentIcon({ name: "Orig", type: "feat" }, cache)?.kind).toBe("item-prefix");
  });

  it("prefers own-monster names with parenthetical suffixes and retains first duplicate precedence", () => {
    expect(resolveDocumentIcon({ name: "Claw (Recharge 5–6)", type: "weapon" }, cache, "Cat")).toMatchObject({
      path: "cat", kind: "monster-exact", entryIndex: 0,
    });
    expect(resolveDocumentIcon({ name: "Claw", type: "weapon" }, cache, "Bear")?.path).toBe("generic");
    expect(resolveDocumentIcon({ name: "Bite", type: "weapon" }, cache, "Bear")?.kind).toBe("other-monster-exact");
  });

  it("uses spell mappings for monster spells and class fallback for subclasses", () => {
    expect(resolveDocumentIcon({ name: "Zap", type: "spell" }, cache, "Cat")?.path).toBe("spell");
    expect(resolveDocumentIcon({ name: "Arcane School", type: "subclass", system: { classIdentifier: "wizard" } }, cache)?.kind).toBe("subclass");
  });

  it("leaves unknown types and empty names unmatched and does not mutate stored entries", () => {
    const rows = [entry("Tool", "tool")];
    const tables = { "items.json": rows };
    const loaded = buildIconCache(tables);
    expect(resolveIconMatch({ name: "" }, "feat", loaded)).toBeNull();
    expect(resolveIconMatch({ name: "Tool" }, "unmapped", loaded)).toBeNull();
    expect(resolveIconMatch({ name: "Tool" }, "equipment", loaded)?.file).toBe("items.json");
    expect(rows[0]).toEqual({ name: "Tool", path: "tool" });
  });
});
