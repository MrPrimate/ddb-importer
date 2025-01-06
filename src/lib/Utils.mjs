// eslint-disable-next-line func-style
const Range = function *(total = 0, step = 1, from = 0) {
  // eslint-disable-next-line no-mixed-operators, no-empty
  for (let i = 0; i < total; yield from + i++ * step) {}
};


export default class Utils {

  static debug() {
    return true;
  }


  static capitalize(s) {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Async for each loop
   *
   * @param  {Array} array Array to loop through
   * @param  {Function} callback Function to apply to each array item loop
   */
  static async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index += 1) {
      // eslint-disable-next-line callback-return, no-await-in-loop
      await callback(array[index], index, array);
    }
  }

  static _range = Range;

  static arrayRange(total = 0, step = 1, from = 0) {
    return Array.from(Utils._range(total, step, from));
  }

  static removeCompendiumLinks(text) {
    const linkRegExTag = /@\w+\[(.*)\](\{.*?\})/g;
    const linkRegExNoTag = /@\w+\[(.*)\]/g;
    function replaceRule(match, p1, p2) {
      if (p2) {
        return `${p2}`;
      } else {
        return `${p1}`;
      }
    }
    return text.replaceAll(linkRegExTag, replaceRule).replaceAll(linkRegExNoTag, replaceRule);
  }

  static normalizeString(str) {
    return str.toLowerCase().replace(/\W/g, "");
  }

  static referenceNameString(str) {
    const identifier = Utils.nameString(str).replaceAll("'", "").replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3");
    return identifier.slugify({ strict: true });
  }

  static idString(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "");
  }

  static namedIDStub(name, { prefix = "ddb", postfix = null, length = 16 } = {}) {
    const nameSplit = name.split(" ").map((n) => Utils.idString(n));
    const remainingN = length - (prefix ? `${prefix}`.length : 0) - (postfix ? `${postfix}`.length : 0);
    const quotient = Math.floor(remainingN / nameSplit.length);
    let remainder = remainingN % nameSplit.length;
    let result = `${prefix ?? ""}`;

    for (let i = 0; i < nameSplit.length; i++) {
      const splitLength = nameSplit[i].length > quotient + remainder
        ? quotient + remainder
        : Math.min(nameSplit[i].length, quotient + remainder);
      result += Utils.capitalize(nameSplit[i].substring(0, splitLength));
      const remainderUsed = splitLength > quotient
        ? splitLength - quotient
        : 0;
      remainder -= remainderUsed;
    }

    if (postfix) result += postfix;
    const padding = length - result.length;
    if (padding > 0) {
      result += "I".repeat(padding);
    }

    return result;
  }

  static nameString(str) {
    return str.replaceAll("’", "'").trim();
  }

  static regexSanitizeString(str) {
    // eslint-disable-next-line no-useless-escape
    return str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, (x) => {
      return `\\${x}`;
    }).trim();
  }

  static stripHtml(html, preferInnerText = false) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    if (preferInnerText) {
      return tmp.innerText ?? tmp.textContent ?? "";
    }
    return tmp.textContent || tmp.innerText || "";
  }

  static htmlToElement(html) {
    const template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

  static htmlToDoc(text) {
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/html");
  }

  static htmlToDocumentFragment(text) {
    const dom = new DocumentFragment();
    $.parseHTML(text).forEach((element) => {
      dom.appendChild(element);
    });
    return dom;
  }

  static replaceHtmlSpaces(str) {
    return str.replace(/&nbsp;/g, ' ').replace(/\xA0/g, ' ').replace(/\s\s+/g, ' ').trim();
  }

  static renderLesserString(str) {
    return Utils.replaceHtmlSpaces(Utils.stripHtml(str)).trim().toLowerCase();
  }

  static stringKindaEqual(a, b) {
    return Utils.renderLesserString(a) === Utils.renderLesserString(b);
  }

  static findByProperty(arr, property, searchString) {
    function levenshtein(a, b) {
      let tmp;
      if (a.length === 0) {
        return b.length;
      }
      if (b.length === 0) {
        return a.length;
      }
      if (a.length > b.length) {
        tmp = a;
        a = b;
        b = tmp;
      }

      let i,
        j,
        res,
        alen = a.length,
        blen = b.length,
        row = Array(alen);
      for (i = 0; i <= alen; i++) {
        row[i] = i;
      }

      for (i = 1; i <= blen; i++) {
        res = i;
        for (j = 1; j <= alen; j++) {
          tmp = row[j - 1];
          row[j - 1] = res;
          res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, Math.min(res + 1, row[j] + 1));
        }
      }
      return res;
    }

    const maxDistance = 3;
    let minDistance = 100;
    let nearestHit = undefined;
    let nearestDistance = minDistance;

    if (!Array.isArray(arr)) return undefined;
    arr
      .filter((entry) => Object.prototype.hasOwnProperty.call(entry, property))
      .forEach((entry) => {
        let distance = levenshtein(searchString, entry[property]);
        if (distance < nearestDistance && distance <= maxDistance && distance < minDistance) {
          nearestHit = entry;
          nearestDistance = distance;
        }
      });

    return nearestHit;
  }

  static calculateModifier(val) {
    return Math.floor((val - 10) / 2);
  }

  static diceStringResultBuild(diceMap, dice, bonus = "", mods = "", diceHint = "", specialFlags = "", addHint = false) {
    const globalDamageHints = addHint;
    const resultBonus = bonus === 0 ? "" : `${bonus > 0 ? ' +' : ' '} ${bonus}`;
    const diceHintAdd = globalDamageHints && diceHint && diceMap;
    const hintString = diceHintAdd ? diceHint.replace("[]", "") : "";
    const diceHintString = diceMap.map(({ sign, count, die }, index) =>
      `${index ? `${sign} ` : ''}${count}d${die}${specialFlags}${hintString}`,
    ).join(' ');

    const result = {
      dice,
      diceMap,
      diceHintString,
      bonus,
      diceString: [
        diceHintString,
        mods,
        resultBonus,
      ].join('').trim(),
    };
    return result;
  }

  static parseDiceString(inStr, mods = "", diceHint = "", specialFlags = "") {
    // sanitizing possible inputs a bit
    const str = `${inStr}`.toLowerCase().replace(/[–-–−]/gu, "-").replace(/\s+/gu, "");

    // all found dice strings, e.g. 1d8, 4d6
    let dice = [];
    // all bonuses, e.g. -1+8
    let bonuses = [];

    const diceRegex = /(?<rawSign>[+-]*)(?<count>\d+)(?:d(?<die>\d+))?/gu;

    for (const { groups } of str.matchAll(diceRegex)) {
      const {
        rawSign = '+',
        count,
        die,
      } = groups;

      // sign. We only take the sign standing exactly in front of the dice string
      // so +-1d8 => -1d8. Just as a failsave
      const sign = rawSign === "" ? "+" : rawSign.slice(-1);

      if (die) {
        dice.push({
          sign,
          count: parseInt(sign + count),
          die: parseInt(die),
        });
      } else {
        bonuses.push({
          sign,
          count: parseInt(sign + count),
        });
      }
    }

    // sum up the bonus
    const bonus = bonuses.reduce((prev, cur) => prev + cur.count, 0);

    // group the dice, so that all the same dice are summed up if they have the same sign
    // e.g.
    // +1d8+2d8 => 3d8
    // +1d8-2d8 => +1d8 -2d8 will remain as-is
    const diceMap = [];

    const groupBySign = Utils.groupBy(dice, 'sign');
    for (const group of groupBySign.values()) {
      const groupByDie = Utils.groupBy(group, 'die');

      for (const dieGroup of groupByDie.values()) {
        diceMap.push(
          dieGroup.reduce((acc, item) => ({
            ...acc,
            count: acc.count + item.count,
          })),
        );
      }
    }

    diceMap.sort((a, b) => {
      if (a.die < b.die) return -1;
      if (a.die > b.die) return 1;
      if (a.sign === b.sign) {
        if (a.count < b.count) return -1;
        if (a.count > b.count) return 1;
        return 0;
      } else {
        return a.sign === "+" ? -1 : 1;
      }
    });

    const result = Utils.diceStringResultBuild(diceMap, dice, bonus, mods, diceHint, specialFlags);
    return result;
  }

  static isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
  }

  static isString(str) {
    return typeof str === 'string' || str instanceof String;
  }

  static isArray(arr) {
    return Array.isArray(arr);
  }

  static isBoolean(bool) {
    return typeof bool === 'boolean';
  }

  static isFunction(func) {
    return func instanceof Function;
  }

  static mergeDeep(target, source) {
    let output = Object.assign({}, target);
    if (Utils.isObject(target) && Utils.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (Utils.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = Utils.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  static filterDeprecated(data) {
    for (let prop in data) {
      if (
        data[prop]
        && Object.prototype.hasOwnProperty.call(data[prop], "_deprecated")
        && data[prop]["_deprecated"] === true
      ) {
        delete data[prop];
      }
      if (prop === "_deprecated" && data[prop] === true) {
        delete data[prop];
      }
    }
    return data;
  }

  static entityMap() {
    let entityTypes = new Map();
    entityTypes.set("npc", "Actor");
    entityTypes.set("character", "Actor");
    entityTypes.set("monsters", "Actor");
    entityTypes.set("monster", "Actor");
    entityTypes.set("extras", "Actor");
    entityTypes.set("summon", "Actor");
    entityTypes.set("summons", "Actor");
    entityTypes.set("scene", "Scene");
    entityTypes.set("page", "JournalEntry");
    entityTypes.set("journal", "JournalEntry");
    entityTypes.set("journalEntry", "JournalEntry");
    entityTypes.set("compendium", "Compendium");

    [
      "feat", "spell", "inventory", "equipment", "consumable", "tool", "loot",
      "item", "class", "backpack", "container", "magic-items", "magic-item-spells",
      "background", "classes", "subclass", "feature", "race", "trait", "species",
      "classfeature",
    ].forEach((type) => {
      entityTypes.set(type, "Item");
      if (!type.endsWith("s")) entityTypes.set(`${type}s`, "Item");
    });
    return entityTypes;
  }

  static versionCompare(v1, v2, options) {
    let lexicographical = options && options.lexicographical,
      zeroExtend = options && options.zeroExtend,
      v1parts = v1.split("."),
      v2parts = v2.split(".");

    function isValidPart(x) {
      return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
      return NaN;
    }

    if (zeroExtend) {
      while (v1parts.length < v2parts.length) v1parts.push("0");
      while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
      v1parts = v1parts.map(Number);
      v2parts = v2parts.map(Number);
    }

    for (let i = 0; i < v1parts.length; ++i) {
      if (v2parts.length == i) {
        return 1;
      }

      if (v1parts[i] > v2parts[i]) {
        return 1;
      }
      if (v1parts[i] < v2parts[i]) {
        return -1;
      }
    }

    if (v1parts.length != v2parts.length) {
      return -1;
    }

    return 0;
  }

  static groupBy(arr, property) {
    const map = new Map();

    for (const item of arr) {
      const prop = item[property];
      const group = map.get(prop) ?? [];

      group.push(item);
      map.set(prop, group);
    }

    return map;
  }

  static async namePrompt(question) {
    const content = `
    <label class="text-label">
      <input type="text" name="name"/>
    </label>
  `;
    const name = await new Promise((resolve) => {
      new Dialog({
        title: question,
        content,
        buttons: {
          ok: {
            label: "Okay",
            callback: async (html) => {
              const value = html.find("input[type='text'][name='name']").val();
              resolve(value);
            },
          },
          cancel: {
            label: "Cancel",
            callback: () => {
              resolve("");
            },
          },
        },
        default: "ok",
        close: () => {
          resolve("");
        },
      }).render(true);
    });
    return name;
  }

  static renderPopup(type, url) {
    if (CONFIG.DDBI.POPUPS[type] && !CONFIG.DDBI.POPUPS[type].close) {
      CONFIG.DDBI.POPUPS[type].focus();
      CONFIG.DDBI.POPUPS[type].location.href = url;
    } else {
      const ratio = window.innerWidth / window.innerHeight;
      const width = Math.round(window.innerWidth * 0.5);
      const height = Math.round(window.innerWidth * 0.5 * ratio);
      CONFIG.DDBI.POPUPS[type] = window.open(
        url,
        "ddb_sheet_popup",
        `resizeable,scrollbars,location=no,width=${width},height=${height},toolbar=1`,
      );
    }
    return true;
  }

  static addToProperties(properties, value) {
    const setProperties = properties
      ? Utils.isArray(properties)
        ? new Set(properties)
        : properties
      : new Set();

    setProperties.add(value);
    return Array.from(setProperties);
  }

  static addArrayToProperties(properties, values) {
    const setProperties = properties
      ? Utils.isArray(properties)
        ? new Set(properties)
        : properties
      : new Set();

    values.forEach((value) => {
      setProperties.add(value);
    });
    return Array.from(setProperties);
  }

  static removeFromProperties(properties, value) {
    const setProperties = properties
      ? Utils.isArray(properties)
        ? new Set(properties)
        : properties
      : new Set();

    setProperties.delete(value);
    return Array.from(setProperties);
  }

  static removeArrayFromProperties(properties, values) {
    const setProperties = properties
      ? Utils.isArray(properties)
        ? new Set(properties)
        : properties
      : new Set();

    values.forEach((value) => {
      setProperties.delete(value);
    });
    return Array.from(setProperties);
  }

  // matchedProperties = { "system.activation.type": "bonus" }
  static matchProperties(document, matchedProperties = {}) {
    for (const [key, value] of Object.entries(matchedProperties)) {
      if (foundry.utils.getProperty(document, key) !== value) {
        return false;
      }
    }
    return true;
  }

  static ordinalSuffixOf(i) {
    let j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  }

  static async wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static async waitFor(fn, maxIter = 600, iterWaitTime = 100) {
    let i = 0;
    const continueWait = (current, max) => {
      // Negative maxIter will wait forever
      if (maxIter < 0) return true;

      return current < max;
    };

    while (!fn(i, i * iterWaitTime) && continueWait(i, maxIter)) {
      i++;
      await Utils.wait(iterWaitTime);
    }
    return i !== maxIter;
  }

  /**
   * Display information when Munching
   * @param {*} note
   * @param {*} nameField
   * @param {*} monsterNote
   */
  static munchNote(note, nameField = false, monsterNote = false) {
    if (nameField) {
      $("#munching-task-name").text(note);
      $("#ddb-importer-monsters").css("height", "auto");
    } else if (monsterNote) {
      $("#munching-task-monster").text(note);
      $("#ddb-importer-monsters").css("height", "auto");
    } else {
      $("#munching-task-notes").text(note);
      $("#ddb-importer-monsters").css("height", "auto");
    }
  }

  static stringIntAdder(one, two) {
    const oneInt = `${one}`.trim().replace(/^[+-]\s*/, "");
    const twoInt = `${two}`.trim().replace(/^[+-]\s*/, "");
    if (Number.isInteger(parseInt(oneInt)) && Number.isInteger(parseInt(twoInt))) {
      const num = parseInt(oneInt) + parseInt(twoInt);
      return `${num}`;
    } else {
      const twoAdjusted = (/^[+-]/).test(`${two}`.trim()) ? two : `+ ${two}`;
      return `${one} ${twoAdjusted}`;
    }
  }

}
