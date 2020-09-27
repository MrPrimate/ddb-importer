import DirectoryPicker from "./lib/DirectoryPicker.js";

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
          if (this.status !== 404) {
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
      await utils.serverFileExists(DirectoryPicker.parse(directoryPath).current + "/" + filename);
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
    async function download(url) {
      return new Promise((resolve, reject) => {
        try {
          let req = new XMLHttpRequest();
          req.open("GET", url);
          req.responseType = "blob";
          req.onerror = () => reject("Network error");
          req.onload = () => {
            console.log(req.response);
            reject("bleh");
            if (req.status === 200) resolve(req.response);
            else reject("Loading error: " + req.statusText);
          };
          req.send();
        } catch (error) {
          reject(error.message);
        }
      });
    }

    async function downloadImage(url) {
      return new Promise((resolve, reject) => {
        fetch(url,{
          method: "GET",
        })
          .then((response) => {
            console.log(response);
            if (!response.ok) {
              reject(error.message)
            }
            return response.blob()})
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
      let data = await download(url);
      //let data = await downloadImage(url);
      console.log("fetched");
      console.log(data);
      let result = await upload(data, path, filename);
      console.log("uploaded");
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
      url = useProxy ? "http://34.244.124.64:8080/" + url : url;
      console.error(`URL: ${url}`);
      let result = await process(url, targetDirectory, filename + "." + ext);
      console.log(result);
      return result;
    } catch (error) {
      console.error(error);
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
    return DirectoryPicker.parse(directoryPath).current + "/" + filename;
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
};

export default utils;
