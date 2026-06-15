import { parseTable, getHeadings } from "../../../vendor/parseTable";
import {
  utils,
  logger,
  DDBItemImporter,
  CompendiumHelper,
  DDBCompendiumFolders,
} from "../../lib/_module";

function diceRollMatcher(_match: string, p1: string, p2: string, p3: string, p4: string, p5: string): string {
  if (p5 && p5.toLowerCase() === "damage") {
    let dmgString = `${p4} damage`;
    dmgString = dmgString[0].toUpperCase() + dmgString.substring(1);
    const diceString = utils.parseDiceString(p2, null, `[${p4.toLowerCase()}]`).diceString;
    return `${p1 ? p1 : ""}[[/r ${diceString} # ${dmgString}]]${p3} damage`;
  } else if (p5 && p1 && p5.toLowerCase() === "points" && p1.toLowerCase() === "regains") {
    const diceString = utils.parseDiceString(p2, null, "[healing]").diceString;
    return `${p1 ? p1 : ""}[[/r ${diceString} # Healing]]${p3} hit points`;
  } else {
    const diceString = utils.parseDiceString(p2).diceString;
    const result = `${p1 ? p1 : ""}[[/r ${diceString}]]${p3 ? p3 : ""} ${p4 ? p4 : ""} ${p5 ? p5 : ""}`.trim();
    return result;
  }
}

export function replaceRollLinks(text: string): string {
  text = text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
  const damageRegex = new RegExp(/([.>( ^]|^|regains +)?(\d*d\d+(?:\s*[+-]\s*\d*d*\d*)*)([.,<)]|$| +) *([a-z,A-Z]*) *(damage|points)?/, "g");
  text = text.replace(damageRegex, diceRollMatcher);

  // const Regex
  // to hit rolls
  const toHitRegex = new RegExp(/ ([+-]) *(\d+) to hit/, "g");
  text = text.replace(toHitRegex, " [[/r 1d20 $1 $2]] to hit");
  return text;
}

export function findDiceColumns(table) {
  const result = [];
  if (table.tHead) {
    const headings = getHeadings(table);
    headings.forEach((h) => {
      const diceRegex = new RegExp(/(\d*[d|D]\d+(\s*[+-]?\s*\d*)?)/, "g");
      const match = h.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").match(diceRegex);
      if (match && !h.match(/lasts 1d10 minutes/i)) {
        result.push(h);
      }
    });
  }
  return result;
}

export function guessTableName(parentName: string, htmlDocument: Document, tableNum: number): string {
  const element = htmlDocument.querySelectorAll("table");
  let track: HTMLElement | null = element[tableNum];
  let sibling = track.previousElementSibling;

  while (!sibling && track.parentElement?.nodeName === "DIV") {
    if (!track.parentElement.previousElementSibling) {
      track = track.parentElement;
    } else {
      sibling = track.parentElement.previousElementSibling;
    }
  }

  if (sibling) {
    return sibling.textContent.split(".")[0];
  } else {
    logger.warn(`No table name identified for ${parentName}`);
    return "";
  }
}


function tableReplacer(htmlDocument: Document, tableNum: number, compendiumTables: any[], compendiumLabel: string): Document {
  // future enhancement - replace liks to DDB spells, monsters, items etc to munched compendium
  const element = htmlDocument.querySelectorAll("table");
  const tablePoint = element[tableNum];

  if (tablePoint) {
    compendiumTables.slice().reverse().forEach((table) => {
      const link = table.uuid
        ? `@UUID[${table.uuid}]`
        : `@Compendium[${compendiumLabel}.${table.name}]`;
      tablePoint.insertAdjacentHTML("afterend", `<div id="table-link">${link}{Open RollTable ${table.name}}</div>`);
    });
  }

  return htmlDocument;
}


function diceInt(text: string): number {
  if (text === "0") return 10;
  if (text === "00") return 100;
  return parseInt(text);
}

/**
 * This could be:
 * a single value e.g. 19
 * a range of values 19-20
 * remaining values 19+
 * @param {*} value
 * @returns {Array} array of range
 */
function getDiceTableRange(value) {
  const document = utils.htmlToDoc(value);
  const text = document.body.textContent.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").replace(/\s/g, "").trim();
  // eslint-disable-next-line no-useless-escape
  const valueRegex = new RegExp(/^(\d+)\-(\d+)|^(\d+)(\+?)$/);
  const valueMatch = text.match(valueRegex);

  if (valueMatch) {
    if (valueMatch[1] !== undefined && valueMatch[2] !== undefined) {
      const low = diceInt(valueMatch[1]);
      const high = diceInt(valueMatch[2]);
      return [low, high];
    }

    if (valueMatch[3]) {
      if (valueMatch[4] !== undefined && valueMatch[4] === "+") {
        const low = diceInt(valueMatch[3]);
        return [low, 0];
      }
      if (valueMatch[4] !== undefined && valueMatch[4] === "") {
        const low = diceInt(valueMatch[3]);
        return [low, low];
      }
    }
  }

  // logger.debug(`Dice range: Unable to table range match '${value}' text was '${text}'`);
  return [];
}


export function buildTable({ parsedTable, keys, diceKeys, tableName, parentName, sourceBook, html }: {
  parsedTable: I5eParsedTable;
  keys: string[];
  diceKeys: string[];
  tableName: string;
  parentName?: string;
  sourceBook?: string;
  html: string;
}): I5eTableData[] {
  const generatedTables: I5eTableData[] = [];

  diceKeys.forEach((diceKey) => {
    const nameExtension = parseInt(diceKey) > 1 ? ` [${diceKey}]` : "";
    const realName = ((tableName && tableName !== "") ? tableName : "Unnamed Table") + nameExtension;
    logger.debug(`Generating table ${realName}`);

    const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
    const formulaMatch = diceKey.match(diceRegex);

    const spellCastingAttackRegex = new RegExp(/make a spell attack roll/ig);
    const spellCastingAttackMatch = diceKey.includes("d20") && spellCastingAttackRegex.test(html);

    const table: I5eTableData = {
      "name": realName,
      "sort": 100000,
      "flags": {
        "ddbimporter": {
          "parentName": parentName,
          "sourceBook": sourceBook,
          "keys": keys,
          "diceKeys": diceKeys,
        },
      },
      "img": "icons/svg/d20-grey.svg",
      "description": "",
      "results": [],
      "formula": formulaMatch
        ? spellCastingAttackMatch
          ? "1d20 + @prof + @attributes.spell.mod"
          : formulaMatch[0].trim()
        : "",
      "replacement": true,
      "displayRoll": true,
    };

    const concatKeys = (keys.length - diceKeys.length) > 1;
    // loop through rows and build result entry.
    // if more than one result key then we will concat the results.
    parsedTable.forEach((entry) => {
      const result: I5eTableResult = {
        // flags: {},
        description: "",
        img: "icons/svg/d20-black.svg",
        resultId: null,
        weight: 1,
        range: [],
        drawn: false,
        resultCollection: "",
      };
      Object.entries(entry).forEach(([key, value]) => {
        if (key === diceKey) {
          result.range = getDiceTableRange(value);
        } else if (diceKeys.includes(key)) return;
        if (concatKeys) {
          if (result.description != "") result.description += "\n\n";
          result.description += `<b>${key}</b>${value}`;
        } else {
          result.description = value as string;
        }
      });
      result.description = replaceRollLinks(result.description);
      const diceRollerRegexp = new RegExp(/\[\[\/r\s*([0-9d+-\s]*)(:?#.*)?\]\]/);
      result.description = result.description.replace(diceRollerRegexp, "[[$1]] ($&)");
      table.results.push(result);
    });

    // Drop any result whose dice range never resolved to a valid [low, high]
    // pair. Foundry rejects RollTable result ranges with fewer than 2 elements,
    // so an unparseable dice cell (e.g. a blank cell in a malformed/compound
    // table) would otherwise crash document creation. No-op for well-formed
    // tables; the "X+" case is already a 2-element [low, 0] handled below.
    table.results = table.results.filter((r) => Array.isArray(r.range) && r.range.length === 2);

    if (table.results.some((r, i, a) => {
      const low = r.range[0];
      const high = r.range[1];
      if (low > high) {
        // console.warn(`Low ${low} is greater than high ${high}`, {
        //   low,
        //   high,
        //   a,
        //   length: a.length,
        //   i,
        // });
        if (high === 0 && i === (a.length - 1)) {
          r.range[1] += 100;
          a[i] = r;
        } else {
          return true;
        }
      }
      return false;
    })) {
      return;
    }
    generatedTables.push(table);

  });

  logger.debug(`Generated Tables for ${tableName}`, generatedTables);

  return generatedTables;
}


// DDB marks the sub-rows of a nested dice table (a primary die that selects a
// sub-table, each with its own die) with this row class.
const NESTED_ROW_CLASS = "generic-dice--second";

export interface NestedDiceEntry {
  range: number[];
  description: string;
}

export interface NestedDiceGroup {
  /** clean sub-table name, e.g. "Immortality" (the "(d4)" suffix stripped) */
  name: string;
  /** the sub-table die, e.g. "d4", or null when the row has no nested die */
  die: string | null;
  /** the primary-die range that selects this group, e.g. [1, 1] */
  range: number[];
  entries: NestedDiceEntry[];
}

export interface NestedDiceParse {
  /** primary die formula, e.g. "d8" */
  primaryDie: string;
  groups: NestedDiceGroup[];
}

function diceFormulaFromHeading(heading: string): string | null {
  const cleaned = heading.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
  const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
  const match = cleaned.match(diceRegex);
  return match ? match[0].trim() : null;
}

function applyResultDescriptionTransforms(html: string): string {
  let description = replaceRollLinks(html);
  const diceRollerRegexp = new RegExp(/\[\[\/r\s*([0-9d+-\s]*)(:?#.*)?\]\]/);
  description = description.replace(diceRollerRegexp, "[[$1]] ($&)");
  return description;
}

function makeTableResult(range: number[], description: string): I5eTableResult {
  return {
    description,
    img: "icons/svg/d20-black.svg",
    resultId: null,
    weight: 1,
    range,
    drawn: false,
    resultCollection: "",
  };
}

/**
 * Detects a nested dice table (a primary die column whose rows each open a
 * sub-table rolled on its own die). DDB flags the sub-rows with
 * `class="generic-dice--second"` and leaves their primary-die cell blank, which
 * `parseTable` flattens away, so detection must run against the DOM node.
 *
 * Returns `null` when the table is not nested (caller falls back to `buildTable`).
 */
export function parseNestedDiceTable(node: HTMLTableElement): NestedDiceParse | null {
  const headings = getHeadings(node, false);
  const primaryHeading = headings[0];
  if (!primaryHeading) return null;
  const primaryDie = diceFormulaFromHeading(primaryHeading);
  if (!primaryDie) return null;

  const rows = node.tBodies[0] ? [...node.tBodies[0].rows] : [];
  if (!rows.some((r) => r.classList.contains(NESTED_ROW_CLASS))) return null;

  const groups: NestedDiceGroup[] = [];
  let current: NestedDiceGroup | null = null;

  for (const row of rows) {
    const cells = [...row.cells];
    if (row.classList.contains(NESTED_ROW_CLASS)) {
      // sub-row: [blank primary cell, sub-die value, description]
      if (!current) continue;
      const range = getDiceTableRange(cells[1] ? cells[1].innerHTML : "");
      const descCell = cells[2] ?? cells[1];
      const description = applyResultDescriptionTransforms(descCell ? descCell.innerHTML : "");
      current.entries.push({ range, description });
    } else {
      // main row: [primary-die value, label (often colspan), …]
      const range = getDiceTableRange(cells[0] ? cells[0].innerHTML : "");
      const labelCell = cells[1] ?? cells[0];
      const labelText = utils.htmlToDoc(labelCell ? labelCell.innerHTML : "").body.textContent.trim();
      const dieMatch = labelText.match(/\((d\d+)\)/i);
      const die = dieMatch ? dieMatch[1].toLowerCase() : null;
      const name = labelText.replace(/\s*\(d\d+\)\s*/i, "").trim();
      current = { name, die, range, entries: [] };
      groups.push(current);
    }
  }

  if (groups.length === 0) return null;
  return { primaryDie, groups };
}

/**
 * Builds the parent RollTable plus one child RollTable per nested sub-table from
 * a `parseNestedDiceTable` result. Pure: id assignment and `@UUID` link wiring
 * are left to the caller, since those differ between the native and muncher
 * import paths. `children[i]` aligns by index with `parent.results[i]` (a group
 * without a nested die yields a `null` child).
 */
export function buildNestedTables({ parse, tableName, parentName, sourceBook }: {
  parse: NestedDiceParse;
  tableName: string;
  parentName?: string;
  sourceBook?: string;
}): { parent: I5eTableData; children: (I5eTableData | null)[] } {
  const flags = (keys: string[], diceKeys: string[]): I5eTableData["flags"] => ({
    ddbimporter: { parentName, sourceBook, keys, diceKeys },
  });

  const skeleton = (name: string, formula: string, results: I5eTableResult[], keys: string[]): I5eTableData => ({
    name,
    sort: 100000,
    flags: flags(keys, [formula]),
    img: "icons/svg/d20-grey.svg",
    description: "",
    results,
    formula,
    replacement: true,
    displayRoll: true,
  });

  const pairs = parse.groups.map((group) => {
    const child = (group.die && group.entries.length > 0)
      ? skeleton(
        `${tableName}: ${group.name}`,
        group.die,
        group.entries
          .map((e) => makeTableResult(e.range, e.description))
          .filter((r) => Array.isArray(r.range) && r.range.length === 2),
        [group.die, group.name],
      )
      : null;
    const result = makeTableResult(group.range, group.name);
    return { result, child };
  }).filter((p) => Array.isArray(p.result.range) && p.result.range.length === 2);

  const parent = skeleton(tableName, parse.primaryDie, pairs.map((p) => p.result), [parse.primaryDie, tableName]);
  const children = pairs.map((p) => p.child);

  return { parent, children };
}


async function buildAndImportTable({
  parsedTable, keys, diceKeys, finalName, name, sourceBook, updateExisting, html, notifier,
}: {
  parsedTable: I5eParsedTable;
  keys: string[];
  diceKeys: string[];
  finalName: string;
  name: string;
  sourceBook?: string;
  updateExisting?: boolean;
  html: string;
  notifier?: (note: any, { nameField, monsterNote, isError, message }?: NotifierV1Props) => void;
}) {
  const data = buildTable({ parsedTable, keys, diceKeys, tableName: finalName, parentName: name, sourceBook, html });
  const handlerOptions = { srdFidding: false, updateIcons: false, notifier };

  // create source-book > parent-entity folders before import so they can be assigned
  if (game.user.isGM) {
    const tableFolders = new DDBCompendiumFolders("tables");
    await tableFolders.loadCompendium("tables");
    for (const table of data) {
      await tableFolders.createTableFolder(table);
    }
  }

  const handler = await DDBItemImporter.buildHandler("tables", data, updateExisting, handlerOptions);
  return handler.results;
}

export async function generateTable({ parentName, html, updateExisting, type = "", sourceBook, notifier = null }: {
  parentName: string;
  html: string;
  updateExisting?: boolean;
  type?: string;
  sourceBook?: string;
  notifier?: (note: any, { nameField, monsterNote, isError, message }?: NotifierV1Props) => void;
}): Promise<string> {
  let name = `${parentName}`;
  const document = utils.htmlToDoc(html);
  const tableNodes = document.querySelectorAll("table");
  const tablesMatched = [];
  let updatedDocument = utils.htmlToDoc(html);
  if (type === "background" && !name.startsWith("Background:")) {
    name = `Background: ${name}`;
  }
  if (name.startsWith("Background:")) {
    const namesArray = name.split(":");
    // if (parentNamesArray.length > 2) parentNamesArray.pop();
    name = namesArray.join(":");
  }

  const tableCompendiumLabel = CompendiumHelper.getCompendiumLabel("tables");
  let tableNum = 0;
  const foundTables = [];
  for (const node of tableNodes) {
    const parsedTable = parseTable(node);
    const keys = getHeadings(node);
    const diceKeys = findDiceColumns(node);
    let nameGuess = guessTableName(name, document, tableNum);
    if (nameGuess.split(" ").length > 5 && diceKeys.length === 1 && keys.length === 2) {
      nameGuess = keys[1];
    } else if (nameGuess.trim() === "") {
      nameGuess = keys[1];
    }
    const finalName = `${name}: ${nameGuess}`;
    const tableGenerated = await CompendiumHelper.queryCompendiumEntry(tableCompendiumLabel, finalName, true);

    logger.debug(`Table detection triggered for ${name} (parentName: ${parentName})!`, {
      finalName,
      diceKeys,
      keys,
      node,
      html,
      parsedTable,
      foundTables,
      nameGuess,
      tableGenerated,
    });

    try {
      const builtTables = tableGenerated
        ? [tableGenerated]
        : await buildAndImportTable({ parsedTable, keys, diceKeys, finalName, name, sourceBook, updateExisting, html, notifier });

      if (builtTables.length > 0) {
        const tableData = {
          nameGuess,
          finalName,
          parentName,
          name,
          tableNum,
          uuids: builtTables.map((t) => t.uuid),
          length: parsedTable.length,
          keys: keys,
          diceKeys: diceKeys,
          diceTable: diceKeys.length > 0,
          multiDiceKeys: diceKeys.length > 1,
          diceKeysNumber: diceKeys.length,
          totalKeys: keys.length,
          builtTables: builtTables.map((t) => t.toObject()),
        };
        tablesMatched.push(tableData);
        updatedDocument = tableReplacer(updatedDocument, tableNum, builtTables, tableCompendiumLabel);
      }
    } catch (error) {
      logger.error("Table parser failed, please log a bug!", error);
    }
    tableNum++;
  }

  return updatedDocument.body.innerHTML;
}
