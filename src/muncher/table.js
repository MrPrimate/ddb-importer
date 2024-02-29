import { parseTable, getHeadings } from "../../vendor/parseTable.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import utils from "../lib/utils.js";
import logger from "../logger.js";
import DDBItemImporter from "../lib/DDBItemImporter.js";

function diceRollMatcher(match, p1, p2, p3, p4, p5) {
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
      const diceRegex = new RegExp(/(\d*[d|D]\d+(\s*[+-]?\s*\d*)?)/, "g");
      const match = h.replace(/[­––−-]/gu, "-").replace(/-+/g, "-").match(diceRegex);
      if (match && !h.match(/lasts 1d10 minutes/i)) {
        result.push(h);
      }
    });
  }
  return result;
}

function guessTableName(parentName, htmlDocument, tableNum) {
  const element = htmlDocument.querySelectorAll('table');
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
    return sibling.textContent.split(".")[0];
  } else {
    logger.warn(`No table name identified for ${parentName}`);
    return "";
  }
}


function tableReplacer(htmlDocument, tableNum, compendiumTables, compendiumLabel) {
  // future enhancement - replace liks to DDB spells, monsters, items etc to munched compendium
  const element = htmlDocument.querySelectorAll('table');
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


function buildTable(parsedTable, keys, diceKeys, tableName, parentName) {
  let generatedTables = [];

  diceKeys.forEach((diceKey) => {
    const nameExtension = diceKeys > 1 ? ` [${diceKeys}]` : "";
    const realName = ((tableName && tableName !== "") ? tableName : "Unnamed Table") + nameExtension;
    logger.debug(`Generating table ${realName}`);

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

    generatedTables.push(table);

  });

  return generatedTables;
}


async function buildAndImportTable(parsedTable, keys, diceKeys, finalName, name, updateExisting) {
  const data = buildTable(parsedTable, keys, diceKeys, finalName, name);

  const handlerOptions = { srdFidding: false, updateIcons: false };
  const handler = await DDBItemImporter.buildHandler("tables", data, updateExisting, handlerOptions);
  return handler.results;
}

export async function generateTable(parentName, html, updateExisting, type = "") {
  let name = `${parentName}`;
  const document = utils.htmlToDoc(html);
  const tableNodes = document.querySelectorAll("table");
  let tablesMatched = [];
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
  let foundTables = [];
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
    // eslint-disable-next-line no-await-in-loop
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

    const builtTables = tableGenerated
      ? [tableGenerated]
      // eslint-disable-next-line no-await-in-loop
      : await buildAndImportTable(parsedTable, keys, diceKeys, finalName, name, updateExisting);

    if (builtTables.length > 0) {
      try {

        let tableData = {
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

      } catch (error) {
        logger.error("Table parser failed, please log a bug!", error);
      }
    }
    tableNum++;
  }

  return updatedDocument.body.innerHTML;
}
