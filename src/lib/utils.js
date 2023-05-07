const utils = {
  debug: () => {
    return true;
  },

  capitalize: (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  removeCompendiumLinks: (text) => {
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
  },

  normalizeString: (str) => {
    return str.toLowerCase().replace(/\W/g, "");
  },

  referenceNameString: (str) => {
    return str.replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .trim();
  },

  stripHtml: (html) => {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  },

  htmlToElement: (html) => {
    const template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  },

  htmlToDoc: (text) => {
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/html");
  },

  replaceHtmlSpaces: (str) => {
    return str.replace(/&nbsp;/g, ' ').replace(/\xA0/g, ' ').replace(/\s\s+/g, ' ').trim();
  },

  renderLesserString: (str) => {
    return utils.replaceHtmlSpaces(utils.stripHtml(str)).trim().toLowerCase();
  },

  stringKindaEqual(a, b) {
    return utils.renderLesserString(a) === utils.renderLesserString(b);
  },

  findByProperty: (arr, property, searchString) => {
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
  },

  calculateModifier: (val) => {
    return Math.floor((val - 10) / 2);
  },

  diceStringResultBuild: (diceMap, dice, bonus = "", mods = "", diceHint = "", specialFlags = "") => {
    const globalDamageHints = game.settings.get("ddb-importer", "use-damage-hints");
    const resultBonus = bonus === 0 ? "" : `${bonus > 0 ? ' +' : ' '} ${bonus}`;
    const diceHintAdd = globalDamageHints && diceHint && diceMap;
    const hintString = diceHintAdd ? diceHint : "";
    const diceHintString = diceMap.map(({ sign, count, die }, index) =>
      `${index ? `${sign} ` : ''}${count}d${die}${specialFlags}${hintString}`
    ).join(' ');

    const result = {
      dice,
      diceMap,
      diceHintString,
      bonus,
      diceString: [
        diceHintString,
        mods,
        resultBonus
      ].join('').trim(),
    };
    return result;
  },

  parseDiceString: (inStr, mods = "", diceHint = "", specialFlags = "") => {
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
        die
      } = groups;

      // sign. We only take the sign standing exactly in front of the dice string
      // so +-1d8 => -1d8. Just as a failsave
      const sign = rawSign === "" ? "+" : rawSign.slice(-1);

      if (die) {
        dice.push({
          sign,
          count: parseInt(sign + count),
          die: parseInt(die)
        });
      } else {
        bonuses.push({
          sign,
          count: parseInt(sign + count)
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

    const groupBySign = utils.groupBy(dice, 'sign');
    for (const group of groupBySign.values()) {
      const groupByDie = utils.groupBy(group, 'die');

      for (const dieGroup of groupByDie.values()) {
        diceMap.push(
          dieGroup.reduce((acc, item) => ({
            ...acc,
            count: acc.count + item.count
          }))
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

    const result = utils.diceStringResultBuild(diceMap, dice, bonus, mods, diceHint, specialFlags);
    return result;
  },

  isObject: (item) => {
    return item && typeof item === "object" && !Array.isArray(item);
  },

  mergeDeep: (target, source) => {
    let output = Object.assign({}, target);
    if (utils.isObject(target) && utils.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (utils.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = utils.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  },

  filterDeprecated: (data) => {
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
  },

  getTemplate: (type) => {
    const templates = game.data.template;
    for (let entityType in templates) {
      if (
        templates[entityType].types
        && Array.isArray(templates[entityType].types)
        && templates[entityType].types.includes(type)
      ) {
        let obj = utils.mergeDeep({}, utils.filterDeprecated(templates[entityType][type]));
        if (obj.templates) {
          obj.templates.forEach((tpl) => {
            obj = utils.mergeDeep(obj, utils.filterDeprecated(templates[entityType].templates[tpl]));
          });
          delete obj.templates;
        }
        // store the result as JSON for easy cloning
        return JSON.stringify(obj);
      }
    }
    return undefined;
  },

  getOrCreateFolder: async (root, entityType, folderName, folderColor = "") => {
    let folder = game.folders.contents.find((f) =>
      f.type === entityType && f.name === folderName
      // if a root folder we want to match the root id for the parent folder
      && (root ? root.id : null) === (f.folder?.id ?? null)
    );
    // console.warn(`Looking for ${root} ${entityType} ${folderName}`);
    // console.warn(folder);
    if (folder) return folder;
    folder = await Folder.create(
      {
        name: folderName,
        type: entityType,
        color: folderColor,
        parent: (root) ? root.id : null,
      },
      { displaySheet: false }
    );
    return folder;
  },

  // eslint-disable-next-line no-unused-vars
  getFolder: async (kind, subFolder = "", baseFolderName = "D&D Beyond Import", baseColor = "#6f0006", subColor = "#98020a", typeFolder = true) => {
    let entityTypes = new Map();
    entityTypes.set("spell", "Item");
    entityTypes.set("equipment", "Item");
    entityTypes.set("consumable", "Item");
    entityTypes.set("tool", "Item");
    entityTypes.set("loot", "Item");
    entityTypes.set("class", "Item");
    entityTypes.set("backpack", "Item");
    entityTypes.set("magic-items", "Item");
    entityTypes.set("magic-item-spells", "Item");
    entityTypes.set("npc", "Actor");
    entityTypes.set("character", "Actor");
    entityTypes.set("extras", "Actor");
    entityTypes.set("scene", "Scene");
    entityTypes.set("page", "JournalEntry");
    entityTypes.set("journal", "JournalEntry");
    entityTypes.set("journalEntry", "JournalEntry");
    entityTypes.set("background", "Item");
    entityTypes.set("compendium", "Compendium");

    const folderName = game.i18n.localize(`ddb-importer.item-type.${kind}`);
    const entityType = entityTypes.get(kind);
    const baseFolder = await utils.getOrCreateFolder(null, entityType, baseFolderName, baseColor);
    const entityFolder = typeFolder ? await utils.getOrCreateFolder(baseFolder, entityType, folderName, subColor) : baseFolder;
    if (subFolder !== "") {
      const subFolderName = subFolder.charAt(0).toUpperCase() + subFolder.slice(1);
      const typeFolder = await utils.getOrCreateFolder(entityFolder, entityType, subFolderName, subColor);
      return typeFolder;
    } else {
      return entityFolder;
    }
  },

  versionCompare: (v1, v2, options) => {
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
  },

  groupBy(arr, property) {
    const map = new Map();

    for (const item of arr) {
      const prop = item[property];
      const group = map.get(prop) ?? [];

      group.push(item);
      map.set(prop, group);
    }

    return map;
  },

  async namePrompt(question) {
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
          }
        },
        default: "ok",
        close: () => {
          resolve("");
        },
      }).render(true);
    });
    return name;
  }
};

export default utils;
