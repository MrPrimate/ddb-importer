import DirectoryPicker from "./lib/DirectoryPicker.js";
import DICTIONARY from './dictionary.js';
import logger from "./logger.js";
import { DDB_CONFIG } from './ddb-config.js';

const PROXY = "https://proxy.vttassets.com/?url=";

let utils = {
  debug: () => {
    return true;
  },

  findByProperty: (arr, property, searchString) => {
    function levenshtein(a, b) {
      var tmp;
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

      var i,
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

  hasChosenCharacterOption: (data, optionName) => {
    const classOptions = [data.character.options.race, data.character.options.class, data.character.options.feat]
      .flat()
      .find((option) => option.definition.name === optionName);
    return !!classOptions;
  },

  getClassFromOptionID: (data, optionId) => {
    // Use case class spell - which class?
    // componentId on spells.class[0].componentId = options.class[0].definition.id
    // options.class[0].definition.componentId = classes[0].classFeatures[0].definition.id
    const option = data.character.options.class.find((option) => option.definition.id === optionId);
    utils.log(option);
    if (option) {
      const klass = data.character.classes.find((klass) =>
        klass.classFeatures.some((feature) => feature.definition.id === option.componentId)
      );
      return klass;
    }
    return undefined;
  },

  /**
   * Look up a component by id
   * For now we assume that most features we are going to want to get a scaling value
   * from are character options
   * @param {*} ddb
   * @param {*} featureId
   */
  findComponentByComponentId: (ddb, componentId) => {
    let result;
    ddb.character.classes.forEach((cls) => {
      const feature = cls.classFeatures.find((component) => component.definition.id === componentId);
      if (feature) result = feature;
    });
    return result;
  },

  /**
   *
   * Gets the sourcebook for a subset of dndbeyond sources
   * @param {obj} definition item definition
   */
  getSourceData: (definition) => {
    const fullSource = game.settings.get("ddb-importer", "use-full-source");
    let result = {
      name: null,
      page: null,
    };
    if (definition.sources) {
      if (definition.sources.length > 0) {
        result.name = DDB_CONFIG.sources
          .filter((source) => definition.sources.some((ds) => source.id === ds.sourceId))
          .map((source) => {
            const dSource = definition.sources.find((ds) => source.id === ds.sourceId);
            const page = (dSource.pageNumber) ? ` pg ${dSource.pageNumber}` : "";
            const sourceBook = (dSource)
              ? (fullSource) ? source.description : source.name
              : "Homebrew";
            return `${sourceBook}${page}`;
          })
          .join(', ');
      }
    } else {
      if (definition.sourceIds) {
        result.name = DDB_CONFIG.sources
          .filter((source) => definition.sourceIds.includes(source.id))
          .map((source) => source.description)
          .join();
      } else if (definition.sourceId) {
        result.name = DDB_CONFIG.sources
          .filter((source) => source.id === definition.sourceId)
          .map((source) => {
            const sourceBook = (fullSource) ? source.description : source.name;
            return sourceBook;
          });
      }

      // add a page num if available
      if (definition.sourcePageNumber) result.page = definition.sourcePageNumber;
    }
    return result;
  },

  /**
   * Fetches the sources and pages for a definition
   * @param {obj} data item
   */
  parseSource: (definition) => {
    const sourceData = utils.getSourceData(definition);

    let source = sourceData.name;
    if (sourceData.page) source += ` (pg. ${sourceData.page})`;

    return source;
  },

  getActiveItemModifiers: (data) => {
    // get items we are going to interact on
    const modifiers = data.character.inventory
      .filter(
        (item) =>
          ((!item.definition.canEquip && !item.definition.canAttune && !item.definition.isConsumable) || // if item just gives a thing and not potion/scroll
          (item.isAttuned && item.equipped) || // if it is attuned and equipped
          (item.isAttuned && !item.definition.canEquip) || // if it is attuned but can't equip
            (!item.definition.canAttune && item.equipped)) && // can't attune but is equipped
          item.definition.grantedModifiers.length > 0
      )
      .flatMap((item) => item.definition.grantedModifiers);

    return modifiers;
  },

  filterModifiers: (modifiers, type, subType = null, restriction = ["", null]) => {
    return modifiers
      .flat()
      .filter(
        (modifier) =>
          modifier.type === type &&
          (subType !== null ? modifier.subType === subType : true) &&
          (!restriction ? true : restriction.includes(modifier.restriction))
      );
  },

  filterBaseModifiers: (data, type, subType = null, restriction = ["", null]) => {
    const modifiers = [
      data.character.modifiers.class,
      data.character.modifiers.race,
      data.character.modifiers.background,
      data.character.modifiers.feat,
      utils.getActiveItemModifiers(data),
    ];

    return utils.filterModifiers(modifiers, type, subType, restriction);
  },

  /**
   * Checks the list of modifiers provided for a matching bonus type
   * and returns a sum of it's value. May include a dice string.
   * @param {*} modifiers
   * @param {*} character
   * @param {*} bonusSubType
   */
  getModifierSum: (modifiers, character) => {
    let sum = 0;
    let diceString = "";
    modifiers.forEach((bonus) => {
      if (bonus.statId !== null) {
        const ability = DICTIONARY.character.abilities.find((ability) => ability.id === bonus.statId);
        sum += character.data.abilities[ability.value].mod;
      } else if (bonus.dice) {
        const mod = bonus.dice.diceString;
        diceString += diceString === "" ? mod : " + " + mod;
      } else {
        sum += bonus.value;
      }
    });
    if (diceString !== "") {
      sum = sum + " + " + diceString;
    }

    return sum;
  },

  findClassByFeatureId: (data, featureId) => {
    const cls = data.character.classes.find((cls) => {
      let classFeatures = cls.classFeatures;
      let featureMatch = classFeatures.find((feature) => feature.definition.id === featureId);
      if (featureMatch) {
        return cls;
      } else {
        // if not in global class feature list lets dig down
        classFeatures = cls.definition.classFeatures;
        if (cls.subclassDefinition && cls.subclassDefinition.classFeatures) {
          classFeatures = classFeatures.concat(cls.subclassDefinition.classFeatures);
        }
        return classFeatures.find((feature) => feature.id === featureId) !== undefined;
      }
    });
    return cls;
  },

  calculateModifier: (val) => {
    return Math.floor((val - 10) / 2);
  },

  parseDiceString: (str, mods = "") => {
    // sanitizing possible inputs a bit
    str = str.toLowerCase().replace(/-–−/g, "-").replace(/\s/g, "");

    // all found dice strings, e.g. 1d8, 4d6
    let dice = [];
    // all bonuses, e.g. -1+8
    let bonuses = [];

    while (str.search(/[+-]*\d+d?\d*/) !== -1) {
      const result = str.match(/([+-]*)(\d+)(d?)(\d*)/);
      str = str.replace(result[0], "");

      // sign. We only take the sign standing exactly in front of the dice string
      // so +-1d8 => -1d8. Just as a failsave
      const sign = result[1] === "" ? "+" : result[1].substr(result[1].length - 1, 1);
      const count = result[2];
      const die = result[4];

      if (result[3] === "d") {
        dice.push({
          sign: sign,
          count: parseInt(sign + count),
          die: parseInt(die),
        });
      } else {
        bonuses.push({
          sign: sign,
          count: parseInt(sign + count),
        });
      }
      // sorting dice by die, then by sign
      dice = dice.sort((a, b) => {
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
    }

    // sum up the bonus
    let bonus = bonuses.reduce((prev, cur) => prev + cur.count, 0);

    // group the dice, so that all the same dice are summed up if they have the same sign
    // e.g.
    // +1d8+2d8 => 3d8
    // +1d8-2d8 => +1d8 -2d8 will remain as-is
    for (let i = 0; i < dice.length - 1; i++) {
      let cur = dice[i];
      let next = i <= dice.length - 1 ? dice[i + 1] : { sign: "+", count: 0, die: cur.die };
      if (cur.die === next.die && cur.sign === next.sign) {
        cur.count += next.count;
        dice.splice(i + 1, 1);
        i--;
      }
    }

    const diceString = dice.reduce((prev, cur) => {
      return (
        prev + " " + (cur.count >= 0 && prev !== "" ? `${cur.sign}${cur.count}d${cur.die}` : `${cur.count}d${cur.die}`)
      );
    }, "");
    const resultBonus = bonus === 0 ? "" : bonus > 0 ? ` + ${bonus}` : ` ${bonus}`;

    const result = {
      dice: dice,
      bonus: bonus,
      diceString: (diceString + mods + resultBonus).trim(),
    };
    return result;
  },


  capitalize: (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  // DEVELOPMENT FUNCTION
  // loads a character.json from a file in the file system
  // loadFromFile: (filename) => {
  //   return require(`./input/${filename}.json`);
  // },

  // checks for a given file
  serverFileExists: (path) => {
    return new Promise((resolve, reject) => {
      let http = new XMLHttpRequest();
      http.open("HEAD", path);
      http.onreadystatechange = function () {
        if (this.readyState == this.DONE) {
          if (this.status >= 200 && this.status <= 399) { // Assume any 2xx or 3xx responses mean the image is there.
            resolve(path);
          } else {
            reject(path);
          }
        }
      };

      http.send();
    });
  },

  fileExists: async (directoryPath, filename) => {
    try {
      let uri = utils.getFileUrl(directoryPath, filename);
      logger.debug('Looking for file at ' + uri);
      await utils.serverFileExists(uri);
      return true;
    } catch (ignored) {
      return false;
    }
  },

  getTemplate: (type) => {
    let isObject = (item) => {
      return item && typeof item === "object" && !Array.isArray(item);
    };

    let mergeDeep = (target, source) => {
      let output = Object.assign({}, target);
      if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
          if (isObject(source[key])) {
            if (!(key in target)) Object.assign(output, { [key]: source[key] });
            else output[key] = mergeDeep(target[key], source[key]);
          } else {
            Object.assign(output, { [key]: source[key] });
          }
        });
      }
      return output;
    };
    let filterDeprecated = (data) => {
      for (let prop in data) {
        if (
          data[prop] &&
          Object.prototype.hasOwnProperty.call(data[prop], "_deprecated") &&
          data[prop]["_deprecated"] === true
        ) {
          delete data[prop];
        }
        if (prop === "_deprecated" && data[prop] === true) {
          delete data[prop];
        }
      }
      return data;
    };

    let templates = game.data.system.template;
    for (let entityType in templates) {
      if (
        templates[entityType].types &&
        Array.isArray(templates[entityType].types) &&
        templates[entityType].types.includes(type)
      ) {
        let obj = mergeDeep({}, filterDeprecated(templates[entityType][type]));
        if (obj.templates) {
          obj.templates.forEach((tpl) => {
            obj = mergeDeep(obj, filterDeprecated(templates[entityType].templates[tpl]));
          });
          delete obj.templates;
        }
        // store the result as JSON for easy cloning
        return JSON.stringify(obj);
      }
    }
    return undefined;
  },

  uploadImage: async function (url, targetDirectory, baseFilename, useProxy = true) {
    async function downloadImage(url) {
      return new Promise((resolve, reject) => {
        fetch(url, {
          method: "GET",
        })
          .then((response) => {
            if (!response.ok) {
              reject("Could not retrieve image");
            }
            return response.blob();
})
          .then((blob) => resolve(blob))
          .catch((error) => reject(error.message));
      });
    }

    async function upload(data, path, filename) {
      return new Promise((resolve, reject) => {
        // create new file from the response

        const uploadFile = async (data, path, filename) => {
          const file = new File([data], filename, { type: data.type });
          const result = await DirectoryPicker.uploadToPath(path, file);
          return result;
        };

        uploadFile(data, path, filename)
          .then((result) => {
            resolve(result.path);
          })
          .catch((error) => {
            utils.log(`error uploading file: ${error}`);
            reject(error);
          });
      });
    }

    async function process(url, path, filename) {
      // let data = await download(url);
      let data = await downloadImage(url);
      // hack as proxy returns ddb access denied as application/xml
      if (data.type === "application/xml") return null;
      let result = await upload(data, path, filename);
      return result;
    }

    // prepare filenames
    let filename = baseFilename;
    let ext = url
      .split(".")
      .pop()
      .split(/#|\?|&/)[0];

    // uploading the character avatar and token
    try {
      url = useProxy ? PROXY + url : url;
      // console.error(`URL: ${url}`);
      let result = await process(url, targetDirectory, filename + "." + ext);
      return result;
    } catch (error) {
      utils.log(error);
      ui.notifications.warn("Image upload failed. Please check your ddb-importer upload folder setting");
      return null;
    }
  },

  // eslint-disable-next-line no-unused-vars
  getFolder: async (kind, type = "", race = "") => {
    let getOrCreateFolder = async (root, entityType, folderName) => {
      const baseColor = "#98020a";

      let folder = game.folders.entities.find(
        (f) => f.data.type === entityType && f.data.name === folderName && f.data.parent === root.id
      );
      if (folder) return folder;
      folder = await Folder.create(
        {
          name: folderName,
          type: entityType,
          color: baseColor,
          parent: root.id,
        },
        { displaySheet: false }
      );
      return folder;
    };

    let entityTypes = new Map();
    entityTypes.set("spell", "Item");
    entityTypes.set("equipment", "Item");
    entityTypes.set("consumable", "Item");
    entityTypes.set("tool", "Item");
    entityTypes.set("loot", "Item");
    entityTypes.set("class", "Item");
    entityTypes.set("backpack", "Item");
    entityTypes.set("npc", "Actor");
    entityTypes.set("character", "Actor");
    entityTypes.set("page", "JournalEntry");
    entityTypes.set("magic-items", "Item");
    entityTypes.set("magic-item-spells", "Item");

    let baseName = "D&D Beyond Import";
    let baseColor = "#6f0006";
    let folderName = game.i18n.localize(`ddb-importer.item-type.${kind}`);

    let entityType = entityTypes.get(kind);

    // get base folder, or create it if it does not exist
    let baseFolder = game.folders.entities.find(
      (folder) => folder.data.type === entityType && folder.data.name === baseName
    );
    if (!baseFolder) {
      baseFolder = await Folder.create(
        {
          name: baseName,
          type: entityType,
          color: baseColor,
          parent: null,
          sort: 30000,
        },
        { displaySheet: false }
      );
    }

    let entityFolder = await getOrCreateFolder(baseFolder, entityType, folderName);
    if (kind === "npc" && type !== "") {
      let typeFolder = await getOrCreateFolder(entityFolder, "Actor", type.charAt(0).toUpperCase() + type.slice(1));
      return typeFolder;
    } else {
      return entityFolder;
    }
  },

  normalizeString: (str) => {
    return str.toLowerCase().replace(/\W/g, "");
  },

  /**
   * Queries a compendium for a single entity
   * Returns either the entry from the index, or the complete entity from the compendium
   */
  queryCompendiumEntry: async (compendiumName, entityName, getEntity = false) => {
    // normalize the entity name for comparision
    entityName = utils.normalizeString(entityName);

    // get the compendium
    let compendium = game.packs.find((pack) => pack.collection === compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    let index = await compendium.getIndex();

    let id = index.find((entity) => utils.normalizeString(entity.name) === entityName);
    if (id && getEntity) {
      let entity = await compendium.getEntity(id._id);
      return entity;
    }
    return id ? id : null;
  },

  /**
   * Queries a compendium for a single entity
   * Returns either the entry from the index, or the complete entity from the compendium
   */
  queryCompendiumEntries: async (compendiumName, entityNames, getEntities = false) => {
    // get the compendium
    let compendium = game.packs.find((pack) => pack.collection === compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    let index = await compendium.getIndex();
    index = index.map((entry) => {
      entry.normalizedName = utils.normalizeString(entry.name);
      return entry;
    });

    // get the indices of all the entitynames, filter un
    let indices = entityNames
      .map((entityName) => {
        // sometimes spells do have restricted use in paranthesis after the name. Let's try to find those restrictions and add them later
        if (entityName.search(/(.+)\(([^()]+)\)*/) !== -1) {
          const match = entityName.match(/(.+)\(([^()]+)\)*/);
          return {
            name: utils.normalizeString(match[1].trim()),
            restriction: match[2].trim(),
          };
        } else {
          return {
            name: utils.normalizeString(entityName),
            restriction: null,
          };
        }
      })
      .map((data) => {
        let entry = index.find((entity) => entity.normalizedName === data.name);
        if (entry) {
          return {
            _id: entry._id,
            name: data.restriction ? `${entry.name} (${data.restriction})` : entry.name,
          };
        } else {
          return null;
        }
      });

    if (getEntities) {
      // replace non-null values with the complete entity from the compendium
      let entities = await Promise.all(
        indices.map((entry) => {
          return new Promise((resolve) => {
            if (entry) {
              compendium.getEntity(entry._id).then((entity) => {
                entity.data.name = entry.name; // transfer restrictions over, if any
                // remove redudant info
                delete entity.data._id;
                delete entity.data.permission;
                resolve(entity.data);
              });
            } else {
              resolve(null);
            }
          });
        })
      );
      return entities;
    }
    return indices;
  },

  /**
   * Queries a compendium for a given entity name
   * @returns the index entries of all matches, otherwise an empty array
   */
  queryCompendium: async (compendiumName, entityName, getEntity = false) => {
    entityName = utils.normalizeString(entityName);

    let compendium = game.packs.find((pack) => pack.collection === compendiumName);
    if (!compendium) return null;
    let index = await compendium.getIndex();
    let id = index.find((entity) => utils.normalizeString(entity.name) === entityName);
    if (id && getEntity) {
      let entity = await compendium.getEntity(id._id);
      return entity;
    }
    return id ? id : null;
  },

  /**
   * Creates or updates a given entity
   */
  createCompendiumEntry: async (compendiumName, entity, updateExistingEntry = false) => {
    let compendium = game.packs.find((pack) => pack.collection === compendiumName);

    if (!compendium) return null;

    let existingEntry = await utils.queryCompendium(compendiumName, entity.name);
    if (existingEntry) {
      if (updateExistingEntry) {
        // update all existing entries
        existingEntry = await compendium.updateEntity({
          ...entity.data,
          _id: existingEntry._id,
        });

        return {
          _id: existingEntry._id,
          img: existingEntry.img,
          name: existingEntry.name,
        };
      } else {
        return existingEntry;
      }
    } else {
      let compendiumEntry = await compendium.createEntity(entity.data);
      return {
        _id: compendiumEntry._id,
        img: compendiumEntry.img,
        name: compendiumEntry.name,
      };
    }
  },

  getFolderHierarchy: (folder) => {
    if (!folder || !folder._parent) return "/";
    return folder._parent._id !== null
      ? `${utils.getFolderHierarchy(folder._parent)}/${folder.name}`
      : `/${folder.name}`;
  },

  log: (msg, section = "general") => {
    const LOG_PREFIX = "DDB Importer";
    if (
      CONFIG &&
      CONFIG.debug &&
      CONFIG.debug.ddbimporter &&
      CONFIG.debug.ddbimporter.dndbeyond &&
      Object.prototype.hasOwnProperty.call(CONFIG.debug.ddbimporter.dndbeyond, section) &&
      CONFIG.debug.ddbimporter.dndbeyond[section]
    )
      switch (typeof msg) {
        case "object":
        case "array":
          console.log(`${LOG_PREFIX} | ${section} > ${typeof msg}`); // eslint-disable-line no-console
          console.log(msg); // eslint-disable-line no-console
          break;
        default:
          console.log(`${LOG_PREFIX} | ${section} > ${msg}`); // eslint-disable-line no-console
      }
  },

  getFileUrl: (directoryPath, filename) => {
    let uri;
    try {
      let dir = DirectoryPicker.parse(directoryPath);
      if (dir.activeSource == 'data') { // Local on-server file system
        uri = dir.current + '/' + filename;
      } else { // S3 Bucket
        uri = game.data.files.s3.endpoint.protocol + '//' + dir.bucket + '.' + game.data.files.s3.endpoint.hostname + "/" + dir.current + '/' + filename;
      }
    } catch (exception) {
      throw new Error('Unable to determine file URL for directoryPath"' + directoryPath + '" and filename"' + filename + '"');
    }
    return uri;
  },

  versionCompare: (v1, v2, options) => {
    var lexicographical = options && options.lexicographical,
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

    for (var i = 0; i < v1parts.length; ++i) {
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

  isModuleInstalledAndActive: (moduleName) => {
    return game.modules.has(moduleName) && game.modules.get(moduleName).active;
  }
};

export default utils;
