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

describe("ItemRarity.fromDescription", () => {
  it("reads the Rarity column of a table in any casing and orders the tiers", () => {
    const description = `<p>Intro.</p><table><thead><tr><th>Spell Level</th><th>Rarity</th><th>Save DC</th></tr></thead>
<tbody><tr><td>&nbsp;1st</td><td>Common</td><td>13</td></tr><tr><td>6th</td><td>Very rare</td><td>17</td></tr>
<tr><td>4th</td><td>Rare</td><td>15</td></tr><tr><td>9th</td><td>Legendary</td><td>19</td></tr></tbody></table>`;
    expect(ItemRarity.fromDescription(description)).toEqual(["common", "rare", "veryRare", "legendary"]);
  });

  it("ignores tables without a Rarity column", () => {
    const description = "<table><tr><th>d100</th><th>Horn Type</th></tr><tr><td>01-40</td><td>Silver</td></tr></table>";
    expect(ItemRarity.fromDescription(description)).toEqual([]);
  });

  it("reads parenthesised tiers in prose", () => {
    const description = "<p>You regain 1d3 + 1 (uncommon), 1d4 + 3 (rare), 1d6 + 4 (very rare), or all (legendary) Hit Dice.</p>";
    expect(ItemRarity.fromDescription(description)).toEqual(["uncommon", "rare", "veryRare", "legendary"]);
    expect(ItemRarity.fromDescription("<p>The typical Magentan Sun-Saw (Uncommon) is a falchion.</p>")).toEqual(["uncommon"]);
  });

  it("does not read a bare adjective as a tier", () => {
    expect(ItemRarity.fromDescription("<p>A rare herb grows here; it is very rare indeed.</p>")).toEqual([]);
    expect(ItemRarity.fromDescription(null)).toEqual([]);
  });
});

describe("ItemRarity.fromSiblings", () => {
  const batch = [
    { name: "Figurine of Wondrous Power (Silver Raven)", rarity: "Uncommon" },
    { name: "Figurine of Wondrous Power (Obsidian Steed)", rarity: "Very Rare" },
    { name: "Figurine of Wondrous Power, Byeshk Worg Pack", rarity: "Very Rare" },
    { name: "Figurine of Wondrous Power", rarity: "Varies" },
    { name: "Banjo of Ol' Jericho Sticks, +3", rarity: "Legendary" },
    { name: "Potion of Healing", rarity: "Common" },
    { name: "Potion of Healing (Greater)", rarity: "Uncommon" },
    { name: "Potion of Healing Touch", rarity: "Common" },
    null,
  ];

  it("collects the concrete tiers of suffixed variants", () => {
    expect(ItemRarity.fromSiblings("Figurine of Wondrous Power", batch)).toEqual(["uncommon", "veryRare"]);
    expect(ItemRarity.fromSiblings("Banjo of Ol' Jericho Sticks", batch)).toEqual(["legendary"]);
  });

  it("matches a suffixed root on its base name without swallowing longer names", () => {
    expect(ItemRarity.fromSiblings("Potion of Healing (Normal)", batch)).toEqual(["common", "uncommon"]);
    expect(ItemRarity.fromSiblings("Potion", batch)).toEqual([]);
    expect(ItemRarity.fromSiblings("", batch)).toEqual([]);
  });

  it("unions description and siblings for a Varies root", () => {
    const description = "<p>The rare form does more (rare).</p>";
    expect(ItemRarity.forVaries("Figurine of Wondrous Power", description, batch)).toEqual(["uncommon", "rare", "veryRare"]);
  });

  it("does not let a single tier override the Varies label", () => {
    expect(ItemRarity.forVaries("Rod of the Honed Mind", "<p>The basic rod (uncommon) hums.</p>", [])).toEqual([]);
    expect(ItemRarity.forVaries("Banjo of Ol' Jericho Sticks", "", batch)).toEqual([]);
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
