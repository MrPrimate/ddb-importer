// @vitest-environment jsdom

import { buildTable, buildNestedTables, findDiceColumns, parseNestedDiceTable } from "../../../src/parser/lib/DDBTable";
import { parseTable, getHeadings } from "../../../vendor/parseTable";

function tableNode(html: string): HTMLTableElement {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.querySelector("table") as HTMLTableElement;
}

// Drive the same pipeline the table builders use: DOM node → headings/dice
// columns/parsed rows → buildTable.
function build(html: string, tableName = "Test Table") {
  const node = tableNode(html);
  const keys = getHeadings(node);
  const diceKeys = findDiceColumns(node);
  const parsedTable = parseTable(node) as I5eParsedTable;
  return buildTable({ parsedTable, keys, diceKeys, tableName, html });
}

// =============================================================================
// Sample tables (DDB compendium HTML)
// =============================================================================

const REGULAR_TABLE = `
<table class="table-compendium table--generic-dice" data-content-chunk-id="0d8f3275">
<caption><h5>Villain's Weakness</h5></caption>
<thead><tr><th>d8</th><th>Weakness</th></tr></thead>
<tbody>
<tr><td>1</td><td>A hidden object holds the villain's soul.</td></tr>
<tr><td>2</td><td>The villain's power is broken if the death of its true love is avenged.</td></tr>
<tr><td>3</td><td>The villain is weakened in the presence of a particular artifact.</td></tr>
<tr><td>4</td><td>A special weapon deals extra damage when used against the villain.</td></tr>
<tr><td>5</td><td>The villain is destroyed if it speaks its true name.</td></tr>
<tr><td>6</td><td>An ancient prophecy or riddle reveals how the villain can be overthrown.</td></tr>
<tr><td>7</td><td>The villain falls when an ancient enemy forgives its past actions.</td></tr>
<tr><td>8</td><td>The villain loses its power if a mystic bargain it struck long ago is completed.</td></tr>
</tbody>
</table>`;

const JOINED_COLUMNS_TABLE = `
<table class="table-compendium table--generic-dice table--left-col3" data-content-chunk-id="e63f3dd5">
<thead><tr><th>d100</th><th>Gems or Art Objects</th><th>Magic Items</th></tr></thead>
<tbody>
<tr><td>01&ndash;06</td><td>&mdash;</td><td>&mdash;</td></tr>
<tr><td>07&ndash;16</td><td>2d6 (7) 10 gp gems</td><td>&mdash;</td></tr>
<tr><td>17&ndash;26</td><td>2d4 (5) 25 gp art objects</td><td>&mdash;</td></tr>
<tr><td>27&ndash;36</td><td>2d6 (7) 50 gp gems</td><td>&mdash;</td></tr>
<tr><td>37&ndash;44</td><td>2d6 (7) 10 gp gems</td><td>Roll 1d6 times on <a href="#MagicItemTableA">Magic Item Table A</a>.</td></tr>
<tr><td>45&ndash;52</td><td>2d4 (5) 25 gp art objects</td><td>Roll 1d6 times on <a href="#MagicItemTableA">Magic Item Table A</a>.</td></tr>
<tr><td>53&ndash;60</td><td>2d6 (7) 50 gp gems</td><td>Roll 1d6 times on <a href="#MagicItemTableA">Magic Item Table A</a>.</td></tr>
<tr><td>61&ndash;65</td><td>2d6 (7) 10 gp gems</td><td>Roll 1d4 times on <a href="#MagicItemTableB">Magic Item Table B</a>.</td></tr>
<tr><td>66&ndash;70</td><td>2d4 (5) 25 gp art objects</td><td>Roll 1d4 times on <a href="#MagicItemTableB">Magic Item Table B</a>.</td></tr>
<tr><td>71&ndash;75</td><td>2d6 (7) 50 gp gems</td><td>Roll 1d4 times on <a href="#MagicItemTableB">Magic Item Table B</a>.</td></tr>
<tr><td>76&ndash;78</td><td>2d6 (7) 10 gp gems</td><td>Roll 1d4 times on <a href="#MagicItemTableC">Magic Item Table C</a>.</td></tr>
<tr><td>79&ndash;80</td><td>2d4 (5) 25 gp art objects</td><td>Roll 1d4 times on <a href="#MagicItemTableC">Magic Item Table C</a>.</td></tr>
<tr><td>81&ndash;85</td><td>2d6 (7) 50 gp gems</td><td>Roll 1d4 times on <a href="#MagicItemTableC">Magic Item Table C</a>.</td></tr>
<tr><td>86&ndash;92</td><td>2d4 (5) 25 gp art objects</td><td>Roll 1d4 times on <a href="#MagicItemTableF">Magic Item Table F</a>.</td></tr>
<tr><td>93&ndash;97</td><td>2d6 (7) 50 gp gems</td><td>Roll 1d4 times on <a href="#MagicItemTableF">Magic Item Table F</a>.</td></tr>
<tr><td>98&ndash;99</td><td>2d4 (5) 25 gp art objects</td><td>Roll once on <a href="#MagicItemTableG">Magic Item Table G</a>.</td></tr>
<tr><td>00</td><td>2d6 (7) 50 gp gems</td><td>Roll once on <a href="#MagicItemTableG">Magic Item Table G</a>.</td></tr>
</tbody>
</table>`;

const NON_ROLL_TABLE = `
<table class="table-compendium table--left-all" data-content-chunk-id="319ec3be">
<caption><h4>Magic Item Rarity</h4></caption>
<thead><tr><th>Rarity</th><th>Character Level</th><th>Value</th></tr></thead>
<tbody>
<tr><td>Common</td><td>1st or higher</td><td>50&ndash;100 gp</td></tr>
<tr><td>Uncommon</td><td>1st or higher</td><td>101&ndash;500 gp</td></tr>
<tr><td>Rare</td><td>5th or higher</td><td>501&ndash;5,000 gp</td></tr>
<tr><td>Very rare</td><td>11th or higher</td><td>5,001&ndash;50,000 gp</td></tr>
<tr><td>Legendary</td><td>17th or higher</td><td>50,001+ gp</td></tr>
</tbody>
</table>`;

const NESTED_TABLE = `
<table class="table-compendium table--generic-dice" data-content-chunk-id="2256f26a">
<caption><h3 id="VillainsScheme">Villain's Scheme</h3></caption>
<thead><tr><th>d8</th><th colspan="2">Objective and Scheme</th></tr></thead>
<tbody>
<tr><td>1</td><td colspan="2"><em>Immortality (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Acquire a legendary item to prolong life</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Ascend to godhood</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Become undead or obtain a younger body</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Steal a planar creature's essence</td></tr>
<tr><td>2</td><td colspan="2"><em>Influence (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Seize a position of power or title</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Win a contest or tournament</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Win favor with a powerful individual</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Place a pawn in a position of power</td></tr>
<tr><td>3</td><td colspan="2"><em>Magic (d6)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Obtain an ancient artifact</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Build a construct or magical device</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Carry out a deity's wishes</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Offer sacrifices to a deity</td></tr>
<tr class="generic-dice--second"><td></td><td>5</td><td>Contact a lost deity or power</td></tr>
<tr class="generic-dice--second"><td></td><td>6</td><td>Open a gate to another world</td></tr>
<tr><td>4</td><td colspan="2"><em>Mayhem (d6)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Fulfill an apocalyptic prophecy</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Enact the vengeful will of a god or patron</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Spread a vile contagion</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Overthrow a government</td></tr>
<tr class="generic-dice--second"><td></td><td>5</td><td>Trigger a natural disaster</td></tr>
<tr class="generic-dice--second"><td></td><td>6</td><td>Utterly destroy a bloodline or clan</td></tr>
<tr><td>5</td><td colspan="2"><em>Passion (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Prolong the life of a loved one</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Prove worthy of another person's love</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Raise or restore a dead loved one</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Destroy rivals for another person's affection</td></tr>
<tr><td>6</td><td colspan="2"><em>Power (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Conquer a region or incite a rebellion</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Seize control of an army</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Become the power behind the throne</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Gain the favor of a ruler</td></tr>
<tr><td>7</td><td colspan="2"><em>Revenge (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Avenge a past humiliation or insult</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Avenge a past imprisonment or injury</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Avenge the death of a loved one</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Retrieve stolen property and punish the thief</td></tr>
<tr><td>8</td><td colspan="2"><em>Wealth (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>Control natural resources or trade</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Marry into wealth</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Plunder ancient ruins</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>Steal land, goods, or money</td></tr>
</tbody>
</table>`;

// =============================================================================
// Regular roll table
// =============================================================================

describe("buildTable - regular roll table", () => {
  it("detects the single dice column", () => {
    expect(findDiceColumns(tableNode(REGULAR_TABLE))).toEqual(["d8"]);
  });

  it("builds one d8 table with 8 well-formed results", () => {
    const tables = build(REGULAR_TABLE, "Villain's Weakness");
    expect(tables).toHaveLength(1);
    const table = tables[0];
    expect(table.formula).toBe("d8");
    expect(table.results).toHaveLength(8);
    expect(table.results!.map((r) => r.range)).toEqual([
      [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8],
    ]);
    expect(table.results![0].description).toContain("A hidden object holds the villain's soul.");
  });
});

// =============================================================================
// Joined-columns table
// =============================================================================

describe("buildTable - joined columns", () => {
  it("builds a d100 table with concatenated columns and correct ranges", () => {
    const tables = build(JOINED_COLUMNS_TABLE, "Treasure Hoard");
    expect(tables).toHaveLength(1);
    const table = tables[0];
    expect(table.formula).toBe("d100");
    expect(table.results).toHaveLength(17);

    // every range resolved to a valid [low, high] pair
    expect(table.results!.every((r) => Array.isArray(r.range) && r.range!.length === 2)).toBe(true);

    const ranges = table.results!.map((r) => r.range);
    expect(ranges[0]).toEqual([1, 6]); // 01-06
    expect(ranges[15]).toEqual([98, 99]); // 98-99
    expect(ranges[16]).toEqual([100, 100]); // 00 -> 100

    // both columns concatenated, with the cross-reference link preserved
    const linkRow = table.results![4]; // 37-44
    expect(linkRow.description).toContain("<b>Gems or Art Objects</b>");
    expect(linkRow.description).toContain("<b>Magic Items</b>");
    expect(linkRow.description).toContain("href=\"#MagicItemTableA\"");
  });
});

// =============================================================================
// Non-roll table (must not become a RollTable)
// =============================================================================

describe("buildTable - non-roll table", () => {
  it("has no dice columns and is therefore skipped", () => {
    expect(findDiceColumns(tableNode(NON_ROLL_TABLE))).toEqual([]);
  });
});

// =============================================================================
// Nested dice table
// =============================================================================

describe("parseNestedDiceTable / buildNestedTables", () => {
  it("detects the nested structure", () => {
    const parse = parseNestedDiceTable(tableNode(NESTED_TABLE));
    expect(parse).not.toBeNull();
    expect(parse!.primaryDie).toBe("d8");
    expect(parse!.groups).toHaveLength(8);
    expect(parse!.groups.map((g) => g.name)).toEqual([
      "Immortality", "Influence", "Magic", "Mayhem", "Passion", "Power", "Revenge", "Wealth",
    ]);
    expect(parse!.groups.map((g) => g.die)).toEqual([
      "d4", "d4", "d6", "d6", "d4", "d4", "d4", "d4",
    ]);
  });

  it("returns null for a non-nested table", () => {
    expect(parseNestedDiceTable(tableNode(REGULAR_TABLE))).toBeNull();
  });

  it("builds a parent table plus one child per group", () => {
    const parse = parseNestedDiceTable(tableNode(NESTED_TABLE))!;
    const { parent, children } = buildNestedTables({ parse, tableName: "Villain's Scheme" });

    expect(parent.formula).toBe("d8");
    expect(parent.results).toHaveLength(8);
    expect(parent.results!.map((r) => r.range)).toEqual([
      [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8],
    ]);

    expect(children).toHaveLength(8);
    expect(children.every((c) => c !== null)).toBe(true);
    expect(children.map((c) => c!.name)).toEqual([
      "Villain's Scheme: Immortality",
      "Villain's Scheme: Influence",
      "Villain's Scheme: Magic",
      "Villain's Scheme: Mayhem",
      "Villain's Scheme: Passion",
      "Villain's Scheme: Power",
      "Villain's Scheme: Revenge",
      "Villain's Scheme: Wealth",
    ]);
    expect(children.map((c) => c!.formula)).toEqual(["d4", "d4", "d6", "d6", "d4", "d4", "d4", "d4"]);
    expect(children.map((c) => c!.results!.length)).toEqual([4, 4, 6, 6, 4, 4, 4, 4]);

    const immortality = children[0]!;
    expect(immortality.results!.map((r) => r.range)).toEqual([[1, 1], [2, 2], [3, 3], [4, 4]]);
    expect(immortality.results![0].description).toContain("Acquire a legendary item to prolong life");

    // no result anywhere has an invalid range
    const allResults = [parent, ...children.map((c) => c!)].flatMap((t) => t.results!);
    expect(allResults.every((r) => Array.isArray(r.range) && r.range!.length === 2)).toBe(true);
  });
});

// =============================================================================
// Safety guard
// =============================================================================

describe("buildTable - safety guard", () => {
  it("drops rows whose dice range cannot be parsed", () => {
    const html = `
<table>
<thead><tr><th>d6</th><th>Result</th></tr></thead>
<tbody>
<tr><td>1</td><td>A</td></tr>
<tr><td></td><td>B</td></tr>
<tr><td>3</td><td>C</td></tr>
</tbody>
</table>`;
    const tables = build(html, "Guarded");
    expect(tables).toHaveLength(1);
    const table = tables[0];
    expect(table.results).toHaveLength(2);
    expect(table.results!.every((r) => Array.isArray(r.range) && r.range!.length === 2)).toBe(true);
    expect(table.results!.map((r) => r.range)).toEqual([[1, 1], [3, 3]]);
  });
});
