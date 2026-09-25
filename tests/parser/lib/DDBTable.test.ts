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
// Sample tables. Synthetic content in the exact markup shapes DDB's compendium
// emits (table--generic-dice, generic-dice--second nesting, entity-encoded d100
// ranges); the row text itself is invented so no book text ships in the repo.
// =============================================================================

const REGULAR_TABLE = `
<table class="table-compendium table--generic-dice" data-content-chunk-id="0d8f3275">
<caption><h5>Lighthouse Rumor</h5></caption>
<thead><tr><th>d8</th><th>Rumor</th></tr></thead>
<tbody>
<tr><td>1</td><td>The keeper has not been seen since the last storm.</td></tr>
<tr><td>2</td><td>Ships steer wide of the point after dark.</td></tr>
<tr><td>3</td><td>A second light sometimes answers from the sea.</td></tr>
<tr><td>4</td><td>The cellar stairs go down further than they should.</td></tr>
<tr><td>5</td><td>Gulls will not land on the gallery rail.</td></tr>
<tr><td>6</td><td>The lamp oil is delivered by a boat with no crew.</td></tr>
<tr><td>7</td><td>A bell rings under the water at low tide.</td></tr>
<tr><td>8</td><td>The logbook's last page is written in a different hand.</td></tr>
</tbody>
</table>`;

const JOINED_COLUMNS_TABLE = `
<table class="table-compendium table--generic-dice table--left-col3" data-content-chunk-id="e63f3dd5">
<thead><tr><th>d100</th><th>Trinkets</th><th>Supplies</th></tr></thead>
<tbody>
<tr><td>01&ndash;06</td><td>&mdash;</td><td>&mdash;</td></tr>
<tr><td>07&ndash;16</td><td>2d6 (7) glass beads</td><td>&mdash;</td></tr>
<tr><td>17&ndash;26</td><td>2d4 (5) carved buttons</td><td>&mdash;</td></tr>
<tr><td>27&ndash;36</td><td>2d6 (7) tin charms</td><td>&mdash;</td></tr>
<tr><td>37&ndash;44</td><td>2d6 (7) glass beads</td><td>Roll 1d6 times on <a href="#SupplyTableA">Supply Table A</a>.</td></tr>
<tr><td>45&ndash;52</td><td>2d4 (5) carved buttons</td><td>Roll 1d6 times on <a href="#SupplyTableA">Supply Table A</a>.</td></tr>
<tr><td>53&ndash;60</td><td>2d6 (7) tin charms</td><td>Roll 1d6 times on <a href="#SupplyTableA">Supply Table A</a>.</td></tr>
<tr><td>61&ndash;65</td><td>2d6 (7) glass beads</td><td>Roll 1d4 times on <a href="#SupplyTableB">Supply Table B</a>.</td></tr>
<tr><td>66&ndash;70</td><td>2d4 (5) carved buttons</td><td>Roll 1d4 times on <a href="#SupplyTableB">Supply Table B</a>.</td></tr>
<tr><td>71&ndash;75</td><td>2d6 (7) tin charms</td><td>Roll 1d4 times on <a href="#SupplyTableB">Supply Table B</a>.</td></tr>
<tr><td>76&ndash;78</td><td>2d6 (7) glass beads</td><td>Roll 1d4 times on <a href="#SupplyTableC">Supply Table C</a>.</td></tr>
<tr><td>79&ndash;80</td><td>2d4 (5) carved buttons</td><td>Roll 1d4 times on <a href="#SupplyTableC">Supply Table C</a>.</td></tr>
<tr><td>81&ndash;85</td><td>2d6 (7) tin charms</td><td>Roll 1d4 times on <a href="#SupplyTableC">Supply Table C</a>.</td></tr>
<tr><td>86&ndash;92</td><td>2d4 (5) carved buttons</td><td>Roll 1d4 times on <a href="#SupplyTableF">Supply Table F</a>.</td></tr>
<tr><td>93&ndash;97</td><td>2d6 (7) tin charms</td><td>Roll 1d4 times on <a href="#SupplyTableF">Supply Table F</a>.</td></tr>
<tr><td>98&ndash;99</td><td>2d4 (5) carved buttons</td><td>Roll once on <a href="#SupplyTableG">Supply Table G</a>.</td></tr>
<tr><td>00</td><td>2d6 (7) tin charms</td><td>Roll once on <a href="#SupplyTableG">Supply Table G</a>.</td></tr>
</tbody>
</table>`;

const NON_ROLL_TABLE = `
<table class="table-compendium table--left-all" data-content-chunk-id="319ec3be">
<caption><h4>Guild Rank</h4></caption>
<thead><tr><th>Rank</th><th>Character Level</th><th>Dues</th></tr></thead>
<tbody>
<tr><td>Apprentice</td><td>1st or higher</td><td>50&ndash;100 gp</td></tr>
<tr><td>Journeyman</td><td>1st or higher</td><td>101&ndash;500 gp</td></tr>
<tr><td>Adept</td><td>5th or higher</td><td>501&ndash;5,000 gp</td></tr>
<tr><td>Master</td><td>11th or higher</td><td>5,001&ndash;50,000 gp</td></tr>
<tr><td>Grandmaster</td><td>17th or higher</td><td>50,001+ gp</td></tr>
</tbody>
</table>`;

const NESTED_TABLE = `
<table class="table-compendium table--generic-dice" data-content-chunk-id="2256f26a">
<caption><h3 id="ExpeditionComplication">Expedition Complication</h3></caption>
<thead><tr><th>d8</th><th colspan="2">Region and Complication</th></tr></thead>
<tbody>
<tr><td>1</td><td colspan="2"><em>Harbor (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>A fog bank rolls in and hides the pier</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>The harbormaster doubles the mooring fee</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>A rival crew claims the last berth</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>The tide leaves the boat stranded on mud</td></tr>
<tr><td>2</td><td colspan="2"><em>Forest (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>The trail markers have been moved</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>A fallen tree blocks the only ford</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Something follows just out of sight</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>The guide refuses to go further</td></tr>
<tr><td>3</td><td colspan="2"><em>Ruins (d6)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>A stair collapses under the first step</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>The map is drawn upside down</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>Fresh footprints lead inward</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>A door seals behind the party</td></tr>
<tr class="generic-dice--second"><td></td><td>5</td><td>The torches gutter in a wind with no source</td></tr>
<tr class="generic-dice--second"><td></td><td>6</td><td>A statue has been recently repainted</td></tr>
<tr><td>4</td><td colspan="2"><em>Market (d6)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>A pickpocket lifts the letter of introduction</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>The only supplier has sold out</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>A crier announces a curfew</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>The coin is the wrong mint and refused</td></tr>
<tr class="generic-dice--second"><td></td><td>5</td><td>A stall fire closes the square</td></tr>
<tr class="generic-dice--second"><td></td><td>6</td><td>The guards are checking papers</td></tr>
<tr><td>5</td><td colspan="2"><em>Temple (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>The rite runs a full day longer than planned</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>The priest asks for a favor first</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>The relic is on loan elsewhere</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>A pilgrim recognises someone in the party</td></tr>
<tr><td>6</td><td colspan="2"><em>Sewers (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>The grate is welded shut</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>Rising water forces a detour</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>A work crew is already down there</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>The lantern oil runs low</td></tr>
<tr><td>7</td><td colspan="2"><em>Palace (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>The invitation names the wrong day</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>A steward demands the weapons be left at the gate</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>The audience is moved to the gardens</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>A courtier mistakes the party for entertainers</td></tr>
<tr><td>8</td><td colspan="2"><em>Wastes (d4)</em></td></tr>
<tr class="generic-dice--second"><td></td><td>1</td><td>The well on the map is dry</td></tr>
<tr class="generic-dice--second"><td></td><td>2</td><td>A sandstorm costs a day of travel</td></tr>
<tr class="generic-dice--second"><td></td><td>3</td><td>The pack animals bolt in the night</td></tr>
<tr class="generic-dice--second"><td></td><td>4</td><td>A caravan offers passage at a steep price</td></tr>
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
    const tables = build(REGULAR_TABLE, "Lighthouse Rumor");
    expect(tables).toHaveLength(1);
    const table = tables[0];
    expect(table.formula).toBe("d8");
    expect(table.results).toHaveLength(8);
    expect(table.results!.map((r) => r.range)).toEqual([
      [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8],
    ]);
    expect(table.results![0].description).toContain("The keeper has not been seen since the last storm.");
  });
});

// =============================================================================
// Joined-columns table
// =============================================================================

describe("buildTable - joined columns", () => {
  it("builds a d100 table with concatenated columns and correct ranges", () => {
    const tables = build(JOINED_COLUMNS_TABLE, "Salvage");
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
    expect(linkRow.description).toContain("<b>Trinkets</b>");
    expect(linkRow.description).toContain("<b>Supplies</b>");
    expect(linkRow.description).toContain("href=\"#SupplyTableA\"");
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
      "Harbor", "Forest", "Ruins", "Market", "Temple", "Sewers", "Palace", "Wastes",
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
    const { parent, children } = buildNestedTables({ parse, tableName: "Expedition Complication" });

    expect(parent.formula).toBe("d8");
    expect(parent.results).toHaveLength(8);
    expect(parent.results!.map((r) => r.range)).toEqual([
      [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8],
    ]);

    expect(children).toHaveLength(8);
    expect(children.every((c) => c !== null)).toBe(true);
    expect(children.map((c) => c!.name)).toEqual([
      "Expedition Complication: Harbor",
      "Expedition Complication: Forest",
      "Expedition Complication: Ruins",
      "Expedition Complication: Market",
      "Expedition Complication: Temple",
      "Expedition Complication: Sewers",
      "Expedition Complication: Palace",
      "Expedition Complication: Wastes",
    ]);
    expect(children.map((c) => c!.formula)).toEqual(["d4", "d4", "d6", "d6", "d4", "d4", "d4", "d4"]);
    expect(children.map((c) => c!.results!.length)).toEqual([4, 4, 6, 6, 4, 4, 4, 4]);

    const harbor = children[0]!;
    expect(harbor.results!.map((r) => r.range)).toEqual([[1, 1], [2, 2], [3, 3], [4, 4]]);
    expect(harbor.results![0].description).toContain("A fog bank rolls in and hides the pier");

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
