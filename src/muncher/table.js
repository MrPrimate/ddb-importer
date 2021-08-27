import { parseTable, getHeadings } from "../../vendor/parseTable.js";
import utils from "../utils.js";
import logger from "../logger.js";
import { updateCompendium } from "./import.js";

function diceRollMatcher(match, p1, p2, p3, p4, p5) {
  if (p5 && p5.toLowerCase() === "damage") {
    let dmgString = `${p4} damage`;
    dmgString = dmgString[0].toUpperCase() + dmgString.substring(1);
    const diceString = utils.parseDiceString(p2, null, `[${p4.toLowerCase()}]`).diceString;
    return `${p1 ? p1: ""}[[/r ${diceString} # ${dmgString}]]${p3} damage`;
  } else if (p5 && p1 && p5.toLowerCase() === "points" && p1.toLowerCase() === "regains") {
    const diceString = utils.parseDiceString(p2, null, "[healing]").diceString;
    return `${p1 ? p1: ""}[[/r ${diceString} # Healing]]${p3} hit points`;
  } else {
    const diceString = utils.parseDiceString(p2).diceString;
    const result = `${p1 ? p1: ""}[[/r ${diceString}]]${p3 ? p3 : ""} ${p4 ? p4 : ""} ${p5 ? p5 : ""}`.trim();
    return result;
  }
}

function replaceRollLinks(text) {
  text = text.replace(/[­––−-]/gu, "-").replace(/-+/g, "-");
  const damageRegex = new RegExp(/([.>( ^]|^|regains +)?(\d*d\d+(?:\s*[+-]\s*\d*d*\d*)*)([.,<)]|$| +) *([a-z,A-Z]*) *(damage|points)?/, "g");
  text = text.replace(damageRegex, diceRollMatcher);

  // const Regex
  // to hit rolls
  const toHitRegex = new RegExp(/ ([+-]) *(\d+) to hit/, "g");
  text = text.replace(toHitRegex, " [[/r 1d20 $1 $2]] to hit");
  return text;
}

function findDiceColumns(table) {
  let result = [];
  if (table.tHead) {
    const headings = getHeadings(table);
    headings.forEach((h) => {
      const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*)?)/, "g");
      const match = h.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").match(diceRegex);
      if (match) {
        result.push(h);
      }
    });
  }
  return result;
}

function guessTableName(parentName, document, tableNum) {
  // const element = document.querySelector(`table[data-content-chunk-id='${contentChunkId}']`);
  const element = document.querySelectorAll('table');
  // const element = $(`table:nth-child(${tableNum})`);
  let track = element[tableNum];
  let sibling = track.previousElementSibling;

  while (!sibling && track.parentElement?.nodeName === "DIV") {
    if (!track.parentElement.previousElementSibling) {
      track = track.parentElement;
    } else {
      sibling = track.parentElement.previousElementSibling;
    }
  }

  if (sibling) {
    console.log(sibling.textContent);
    return sibling.textContent;
  } else {
    logger.warn(`No table name identified for ${parentName}`);
    return "";
  }
}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function tableReplacer(text, journals) {
  text = replacer.moduleReplaceLinks(text, journals, config);
  text = replacer.foundryCompendiumReplace(text, config);
  const document = utils.htmlToDoc(text);
  text = document.body.textContent;
}

function textTableReplacer(text, tables) {
  const dom = utils.htmlToDoc(text);
  // document.querySelector('.titanic:nth-child(2)')

  tables.forEach((table) => {
    const tablePoint = dom.body.querySelector(`table[data-content-chunk-id="${table.flags.ddb.contentChunkId}"]`);
    if (tablePoint) {
      console.log(`Updating table reference for: ${table.name}`);
      tablePoint.insertAdjacentHTML("afterend", `<div id="table-link">@RollTable[${table.name}]{Open RollTable}</div>`);
    }
  });
  text = dom.body.innerHTML;
}

async function fixUpTables(tables, journals) {
  console.log("Updating table references for modules...");
  console.log(`There are ${tables.length} tables`);
  console.log(`There are ${journals.length} journals`);

  await sleep(1000);

  for (let tableIndex = 0, tablesLength = tables.length; tableIndex < tablesLength; tableIndex++) {
    const table = tables[tableIndex];
    console.log(`Updating table: ${table.name}...`);
    for (let resultsIndex = 0, resultsLength = table.results.length; resultsIndex < resultsLength; resultsIndex++) {
      tableReplacer(table.results[resultsIndex].text, journals);
    }
    if (tableIndex % 10 == 0) {
      await sleep(500);
    }
  }
  await sleep(1000);

  console.log("Starting Journal Table Updates");

  for (let journalIndex = 0, journalsLength = journals.length; journalIndex < journalsLength; journalIndex++) {
    journalTableReplacer(journals[journalIndex], tables);
    if (journalIndex % 5 == 0) {
      await sleep(500);
    }
  }

  return [tables, journals];
}

function diceInt(text) {
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
 * @returns array of range
 */
function getDiceTableRange(value) {
  const document = utils.htmlToDoc(value);
  const text = document.body.textContent.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").replace(/\s/g, "").trim();
  // eslint-disable-next-line no-useless-escape
  const valueRegex = new RegExp(/^(\d+)\-(\d+)|^(\d+)(\+?)$/);
  const valueMatch = text.match(valueRegex);

  console.warn(valueMatch);

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

  console.log(`Unable to table range match ${value}`);
  console.log(`Text value: ${text}`);
  return [];
}


function buildTable(parsedTable, keys, diceKeys, tableName, parentName) {
  let generatedTables = [];

  diceKeys.forEach((diceKey) => {
    const nameExtension = diceKeys > 1 ? ` [${diceKeys}]` : "";
    const realName = ((tableName && tableName !== "") ? tableName : "Unnamed Table") + nameExtension;
    console.log(`Generating table ${realName}`);

    const diceRegex = new RegExp(/(\d*d\d+(\s*[+-]?\s*\d*d*\d*)?)/, "g");
    const formulaMatch = diceKey.match(diceRegex);

    let table = {
      "name": realName,
      "sort": 100000,
      "flags": {
        "ddbimporter": {
          "parentName": parentName,
          "keys": keys,
          "diceKeys": diceKeys
        }
      },
      "img": "icons/svg/d20-grey.svg",
      "description": "",
      "results": [],
      "formula": formulaMatch ? formulaMatch[0].trim() : "",
      "replacement": true,
      "displayRoll": true,
    };

    const concatKeys = (keys.length - diceKeys.length) > 1;
    // loop through rows and build result entry.
    // if more than one result key then we will concat the results.
    parsedTable.forEach((entry) => {
      const result = {
        flags: {},
        type: 0,
        text: "",
        img: "icons/svg/d20-black.svg",
        resultId: "",
        weight: 1,
        range: [],
        drawn: false
      };
      Object.entries(entry).forEach(([key, value]) => {
        if (key === diceKey) {
          result.range = getDiceTableRange(value);
        }
        else if (diceKeys.includes(key)) return;
        if (concatKeys) {
          if (result.text != "") result.text += "\n\n";
          result.text += `<b>${key}</b>${value}`;
        } else {
          result.text = value;
        }
      });
      result.text = replaceRollLinks(result.text);
      const diceRollerRegexp = new RegExp(/\[\[\/r\s*([0-9d+-\s]*)(:?#.*)?\]\]/);
      result.text = result.text.replace(diceRollerRegexp, "[[$1]] ($&)");
      table.results.push(result);
    });

    console.log(`Generated table entry ${realName}`);
    // const realTable = new RollTable(table);
    // generatedTables.push(realTable);
    generatedTables.push(table);

  });

  return generatedTables;
}


export function generateTable(parentName, html, updateExisting) {
  const document = utils.htmlToDoc(html);
  const tableNodes = document.querySelectorAll("table");
  let tablesMatched = [];

  let tableNum = 0;
  tableNodes.forEach((node) => {
    const parsedTable = parseTable(node);
    const keys = getHeadings(node);
    const diceKeys = findDiceColumns(node);
    // const contentChunkId = node.getAttribute("data-content-chunk-id");
    let nameGuess = guessTableName(parentName, document, tableNum);

    console.warn(`Table detection triggered for ${parentName}!`);
    console.log(`Table: "${nameGuess}"`);
    console.log(`Dice Keys: ${diceKeys.join(", ")}`);
    console.log(`Keys: ${keys.join(", ")}`);

    // if (config.debug) console.log(node.outerHTML);
    // if (config.debug && parsedTable) console.log(parsedTable);
    // if (parsedTable) console.log(parsedTable);

    if (nameGuess.split(" ").length > 5 && diceKeys.length === 1 && keys.length === 2) {
      nameGuess = keys[1];
    }

    const finalName = `${parentName}: ${nameGuess}`;

    const builtTables = buildTable(parsedTable, keys, diceKeys, finalName, parentName);
    if (builtTables.length > 0) {

      updateCompendium("tables", { tables: builtTables }, updateExisting).then((compendiumTables) => {
        tablesMatched.push({
          nameGuess,
          finalName,
          parentName,
          tableNum,
          length: parsedTable.length,
          keys: keys,
          diceKeys: diceKeys,
          diceTable: diceKeys.length > 0,
          multiDiceKeys: diceKeys.length > 1,
          diceKeysNumber: diceKeys.length,
          totalKeys: keys.length,
          builtTables,
          compendiumTables,
        });
      });
    }
    tableNum++;
  });

  if (tablesMatched.length > 0) console.warn(tablesMatched);

  return tablesMatched;

}
