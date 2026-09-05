import { describe, expect, it } from "vitest";
import { ItemRarity } from "../../src/lib/ItemRarity";

describe("ItemRarity.fromDDB", () => {
  it("maps DDB labels to dnd5e keys", () => {
    expect(ItemRarity.fromDDB("Very Rare", true)).toEqual(["veryRare"]);
    expect(ItemRarity.fromDDB("Legendary", true)).toEqual(["legendary"]);
    expect(ItemRarity.fromDDB("Common", true)).toEqual(["common"]);
  });

  it("treats non-magical Common gear as mundane", () => {
    expect(ItemRarity.fromDDB("Common", false)).toEqual([]);
  });

  it("drops Varies, Unknown Rarity and empty input", () => {
    expect(ItemRarity.fromDDB("Varies", true)).toEqual([]);
    expect(ItemRarity.fromDDB("Unknown Rarity", true)).toEqual([]);
    expect(ItemRarity.fromDDB(null, true)).toEqual([]);
    expect(ItemRarity.fromDDB(undefined, false)).toEqual([]);
    expect(ItemRarity.fromDDB("", true)).toEqual([]);
  });
});

describe("ItemRarity.keys", () => {
  it("reads an array or a Set", () => {
    expect(ItemRarity.keys({ rarities: ["rare"] })).toEqual(["rare"]);
    expect(ItemRarity.keys({ rarities: new Set(["uncommon", "rare"]) })).toEqual(["uncommon", "rare"]);
  });

  it("falls back to a legacy string only when the set is absent", () => {
    expect(ItemRarity.keys({ rarity: "veryRare" })).toEqual(["veryRare"]);
    expect(ItemRarity.keys({ rarity: "Very Rare" })).toEqual(["veryRare"]);
    expect(ItemRarity.keys({ rarity: "varies" })).toEqual(["varies"]);
    expect(ItemRarity.keys({ rarity: "" })).toEqual([]);
  });

  it("lets a defined but empty set win over a stale legacy string", () => {
    expect(ItemRarity.keys({ rarities: [], rarity: "rare" })).toEqual([]);
    expect(ItemRarity.keys({ rarities: ["common"], rarity: "rare" })).toEqual(["common"]);
  });

  it("copes with missing system data", () => {
    expect(ItemRarity.keys(undefined)).toEqual([]);
    expect(ItemRarity.keys({})).toEqual([]);
    expect(ItemRarity.first({})).toBeUndefined();
  });
});

describe("ItemRarity.legacyString", () => {
  it("exposes the raw legacy value and nothing else", () => {
    expect(ItemRarity.legacyString({ rarity: "varies" })).toBe("varies");
    expect(ItemRarity.legacyString({ rarities: ["rare"] })).toBeUndefined();
    expect(ItemRarity.legacyString({ rarity: "" })).toBeUndefined();
  });
});
