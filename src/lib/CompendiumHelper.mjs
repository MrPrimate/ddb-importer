import { logger, utils, DDBItemImporter, FileHelper } from "./_module.mjs";
import { SETTINGS } from '../config/_module.mjs';

const CompendiumHelper = {

  // a mapping of compendiums with content type
  LOOKUP: [
    { type: "adventure", compendium: "entity-adventure-compendium" },
    { type: "adventures", compendium: "entity-adventure-compendium" },
    { type: "background", compendium: "entity-background-compendium" },
    { type: "backgrounds", compendium: "entity-background-compendium" },
    { type: "class", compendium: "entity-class-compendium" },
    { type: "classes", compendium: "entity-class-compendium" },
    { type: "classfeatures", compendium: "entity-class-compendium" },
    { type: "consumable", compendium: "entity-item-compendium" },
    { type: "container", compendium: "entity-item-compendium" },
    { type: "custom", compendium: "entity-override-compendium" },
    { type: "equipment", compendium: "entity-item-compendium" },
    { type: "feat", compendium: "entity-class-compendium" },
    { type: "feats", compendium: "entity-feat-compendium" },
    { type: "feature", compendium: "entity-class-compendium" },
    { type: "features", compendium: "entity-class-compendium" },
    { type: "inventory", compendium: "entity-item-compendium" },
    { type: "item", compendium: "entity-item-compendium" },
    { type: "items", compendium: "entity-item-compendium" },
    { type: "journal", compendium: "entity-journal-compendium" },
    { type: "JournalEntry", compendium: "entity-journal-compendium" },
    { type: "journals", compendium: "entity-journal-compendium" },
    { type: "loot", compendium: "entity-item-compendium" },
    { type: "magicitem", compendium: "entity-item-compendium" },
    { type: "magicitems", compendium: "entity-item-compendium" },
    { type: "monster", compendium: "entity-monster-compendium" },
    { type: "monsters", compendium: "entity-monster-compendium" },
    { type: "npc", compendium: "entity-monster-compendium" },
    { type: "override", compendium: "entity-override-compendium" },
    { type: "race", compendium: "entity-species-compendium" },
    { type: "races", compendium: "entity-species-compendium" },
    { type: "species", compendium: "entity-species-compendium" },
    { type: "RollTable", compendium: "entity-table-compendium" },
    { type: "spell", compendium: "entity-spell-compendium" },
    { type: "spell", compendium: "entity-spell-compendium" },
    { type: "spells", compendium: "entity-spell-compendium" },
    { type: "subclass", compendium: "entity-class-compendium" },
    { type: "subclasses", compendium: "entity-class-compendium" },
    { type: "summon", compendium: "entity-summons-compendium" },
    { type: "summons", compendium: "entity-summons-compendium" },
    { type: "table", compendium: "entity-table-compendium" },
    { type: "tables", compendium: "entity-table-compendium" },
    { type: "tool", compendium: "entity-item-compendium" },
    { type: "trait", compendium: "entity-species-compendium" },
    { type: "traits", compendium: "entity-species-compendium" },
    { type: "vehicle", compendium: "entity-vehicle-compendium" },
    { type: "vehicles", compendium: "entity-vehicle-compendium" },
    { type: "weapon", compendium: "entity-item-compendium" },
  ],

  getCompendiumLabel: (type) => {
    const compendiumName = CompendiumHelper.LOOKUP.find((c) => c.type == type).compendium;
    const compendiumLabel = game.settings.get("ddb-importer", compendiumName);
    return compendiumLabel;
  },

  getCompendium: (label, fail = true) => {
    const compendium = game.packs.get(label);
    if (compendium) {
      return compendium;
    } else {
      if (fail) {
        logger.error(`Unable to find compendium ${label}`);
        ui.notifications.error(`Unable to open the Compendium ${label}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums"`);
        throw new Error(`Unable to open the Compendium ${label}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums".`);
      } else {
        logger.info(`Unable to find compendium ${label}`);
      }
      return undefined;
    }
  },

  getCompendiumType: (type, fail = true) => {
    const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
    logger.debug(`Getting compendium ${compendiumLabel} for update of ${type}`);
    const compendium = CompendiumHelper.getCompendium(compendiumLabel, false);
    if (compendium) {
      return compendium;
    } else {
      if (fail) {
        logger.error(`Unable to find compendium ${compendiumLabel} for ${type} documents`);
        ui.notifications.error(`Unable to open the Compendium ${compendiumLabel}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums"`);
        throw new Error(`Unable to open the Compendium ${compendiumLabel}. Check the compendium exists and is set in "Module Settings > DDB Importer > Compendiums"`);
      } else {
        logger.info(`Unable to open compendium, skipping compendium ${compendiumLabel} for ${type} integration`);
      }
      return undefined;
    }
  },

  loadCompendiumIndex: async (type, indexOptions = {}) => {
    const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
    foundry.utils.setProperty(CONFIG.DDBI, `compendium.label.${type}`, compendiumLabel);
    const compendium = await CompendiumHelper.getCompendium(compendiumLabel);

    if (compendium) {
      const index = await compendium.getIndex(indexOptions);
      foundry.utils.setProperty(CONFIG.DDBI, `compendium.index.${type}`, index);
      return index;
    } else {
      return undefined;
    }
  },

  /* eslint-disable require-atomic-updates */
  copyExistingActorProperties: async (type, foundryActor) => {
    const compendium = CompendiumHelper.getCompendiumType(type);

    if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
      const existingNPC = await compendium.getDocument(foundryActor._id);

      const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
      if (!updateImages && !utils.isDefaultOrPlaceholderImage(foundry.utils.getProperty(existingNPC, "system.img"))) {
        foundryActor.img = existingNPC.system.img;
      }
      if (!updateImages && !utils.isDefaultOrPlaceholderImage(foundry.utils.getProperty(existingNPC, "prototypeToken.texture.src"))) {
        const oldValues = foundry.utils.duplicate(existingNPC.prototypeToken);
        delete oldValues.name;
        delete oldValues.sight;
        delete oldValues.light;
        foundryActor.prototypeToken = foundry.utils.mergeObject(foundryActor.prototypeToken, oldValues);
      }

      const retainBiography = game.settings.get("ddb-importer", "munching-policy-monster-retain-biography");
      if (retainBiography) {
        foundryActor.system.details.biography = existingNPC.system.details.biography;
      }

      DDBItemImporter.copySupportedItemFlags(existingNPC.toObject(), foundryActor);
    }

    return foundryActor;

  },
  /* eslint-enable require-atomic-updates */

  getActorIndexActor: async (type, npc) => {
    const monsterIndexFields = ["name", "flags.ddbimporter.id", "system.source.rules"];
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    const index = await CompendiumHelper.loadCompendiumIndex(type, { fields: monsterIndexFields });
    const npcMatch = index.contents.find((entity) =>
      foundry.utils.hasProperty(entity, "flags.ddbimporter.id")
      && entity.flags.ddbimporter.id == npc.flags.ddbimporter.id
      && ((!legacyName && entity.name.toLowerCase() === npc.name.toLowerCase())
        || (legacyName && npc.flags.ddbimporter.isLegacy && npc.name.toLowerCase().startsWith(entity.name.toLowerCase()))
        || (legacyName && entity.name.toLowerCase() === npc.name.toLowerCase())),
    );
    return npcMatch;
  },

  existingActorCheck: async (type, foundryActor) => {
    const matchingActor = await CompendiumHelper.getActorIndexActor(type, foundryActor);
    if (matchingActor) {
      logger.debug(`Found existing ${type}, updating: ${matchingActor.name}`);
      // eslint-disable-next-line require-atomic-updates
      foundryActor._id = matchingActor._id;
      foundryActor = await CompendiumHelper.copyExistingActorProperties(type, foundryActor);
    } else {
      logger.debug(`No existing compendium match for ${foundryActor.name}`);
    }
    return foundryActor;
  },

  sanitize: (text) => {
    if (text && typeof text === "string") {
      return text.replace(/\s|\./g, '-').toLowerCase();
    }
    return text;
  },

  getDefaultCompendiumName: (compendiumLabel) => {
    const sanitizedLabel = CompendiumHelper.sanitize(compendiumLabel);
    const name = `ddb-${game.world.id}-${sanitizedLabel}`;
    return name;
  },

  async getCompendiumBannerImage(url, name) {
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "persistent-storage-location").replace(/^\/|\/$/g, "");

    const downloadOptions = {
      type: "banner",
      name,
      download: true,
      targetDirectory,
      pathPostfix: "/ddb/banner",
    };
    const img = await FileHelper.getImagePath(url, downloadOptions);
    return img;
  },

  /**
   * Checks if a compendium exists with the given id or label, if not, creates a new one.
   * @param {object} options
   * @param {string} options.label Label of compendium to find
   * @param {string} options.type Name of compendium
   * @param {string} [options.id] Id of compendium, optional, used in place of label to find compendium
   * @param {string} [options.packageType] package type of compendium, defaults to world
   * @param {string} [options.folderId] folder id for compendium
   * @param {string[]} [options.dnd5eTypeTags] dnd5e type tags for compendium
   * @param {number} [options.version] version of compendium
   * @param {string} [options.image] banner image for compendium
   * @param {string} [options.title] title of compendium
   * @returns {object} Object consisting of compendium and creation result
   */
  createIfNotExists: async ({
    label,
    type,
    id = undefined,
    packageType = "world",
    folderId = null,
    // eslint-disable-next-line no-unused-vars
    dnd5eTypeTags = [],
    version = null,
    image = null,
    title,
  } = {}) => {
    if (id) logger.debug(`Checking if Compendium with id ${id} exists for ${SETTINGS.MODULE_ID} in ${folderId}`);
    else if (label) logger.debug(`Checking if Compendium with label ${label} exists for ${SETTINGS.MODULE_ID} in ${folderId}`);
    const compendium = (await game.packs.get(id)) ?? game.packs.find((p) => p.metadata.label === label);
    if (compendium) {
      logger.debug(`Compendium '${id}' (${compendium.metadata.label}) found, will not create compendium.`);
      return {
        compendium,
        created: false,
      };
    } else {
      logger.info(`Compendium for ${label}, was not found, creating it now.`);
      const name = CompendiumHelper.getDefaultCompendiumName(label);
      const defaultCompendium = await game.packs.get(`${packageType}.${name}`);
      if (defaultCompendium) {
        logger.error(`Could not load Compendium '${id}', and could not create default Compendium '${name}' as it already exists. Please check your DDB Importer Compendium setup.`);
        return {
          compendium: null,
          created: false,
        };
      } else {
        // create a compendium for the user
        const banner = image ? await CompendiumHelper.getCompendiumBannerImage(image, title) : null;
        const newCompendium = await (foundry.documents?.collections?.CompendiumCollection ?? CompendiumCollection).createCompendium({
          type,
          label,
          name,
          package: packageType,
          banner,
          flags: {
            // dnd5e: {
            //   types: dnd5eTypeTags,
            // },
            ddbimporter: {
              schema: version,
            },
          },
        });
        if (folderId) await newCompendium.setFolder(folderId);
        return {
          compendium: newCompendium,
          created: true,
          banner,
        };
      }
    }
  },

  getCompendiumNames: () => {
    return SETTINGS.COMPENDIUMS.map((ddbCompendium) => {
      return game.settings.get(SETTINGS.MODULE_ID, ddbCompendium.setting);
    });
  },

  deleteDefaultCompendiums: (force = true) => {
    if (!force) {
      logger.warn("Pass 'true' to this function to force deletion.");
    }
    game.settings.set(SETTINGS.MODULE_ID, "auto-create-compendium", false);

    const clone = foundry.utils.deepClone(SETTINGS.DEFAULT_SETTINGS);
    const compendiumSettings = SETTINGS.APPLY_GLOBAL_DEFAULTS(clone.READY.COMPENDIUMS);

    for (const [name, data] of Object.entries(compendiumSettings)) {
      const compendiumName = CompendiumHelper.getDefaultCompendiumName(data.default);

      logger.warn(`Setting: ${name} : Deleting compendium ${data.name} with key world.${compendiumName}}`);
      game.packs.delete(`world.${compendiumName}`);
    }
  },


  /**
   * Queries a compendium for a single document. Returns either the entry from the index, or the complete document
   * @param {string} compendiumName The name of the compendium to query
   * @param {string} documentName The name of the document to query
   * @param {boolean} getDocument If true, returns the complete document from the compendium. Defaults to false.
   * @returns {object|null} The entry from the index, or the complete document if getDocument is true. Null if no match.
   */
  queryCompendiumEntry: async (compendiumName, documentName, getDocument = false) => {
    // normalize the entity name for comparison
    documentName = utils.normalizeString(documentName);

    // get the compendium
    const compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    const index = await compendium.getIndex();

    let id = index.find((entity) => utils.normalizeString(entity.name) === documentName);
    if (id && getDocument) {
      let entity = await compendium.getDocument(id._id);
      return entity;
    }
    return id ? id : null;
  },

  /**
   * Queries a compendium for multiple documents based on their names.
   * Optionally retrieves the complete document from the compendium.
   *
   * @param {object} options The options object.
   * @param {string} options.compendiumName The name of the compendium to query.
   * @param {string[]} options.documentNames An array of document names to query.
   * @param {boolean} [options.getDocuments=false] If true, returns the complete documents from the compendium.
   * @param {string[]} [options.matchedProperties=[]] An array of properties to match in the index.
   * @param {boolean} [options.useParenthesisMatch=false] If true, uses parentheses to match the document name.
   * @returns {Promise<Array<object|null>>} A promise that resolves to an array of document entries or complete documents.
   *                                        Returns null for documents that are not found.
   */
  queryCompendiumEntries: async ({ compendiumName, documentNames, getDocuments = false, matchedProperties = {}, useParenthesisMatch = true } = {}) => {
    // get the compendium
    let compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    const matchedPropertiesKeys = Object.keys(matchedProperties);
    const fields = ["name", "flags.ddbimporter.originalName", ...matchedPropertiesKeys];
    let index = await compendium.getIndex({ fields });
    index = index.map((entry) => {
      entry.normalizedName = utils.normalizeString(entry.name);
      entry.originalNormalisedName = utils.normalizeString(entry.flags?.ddbimporter?.originalName ?? entry.name);
      return entry;
    });

    // get the indices of all the entitynames, filter un
    let indices = documentNames
      .map((entityName) => {
        // sometimes spells do have restricted use in paranthesis after the name. Let's try to find those restrictions and add them later
        if (useParenthesisMatch && entityName.search(/(.+)\(([^()]+)\)*/) !== -1) {
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
        let entry = index.find((entity) => {
          const nameMatch = (entity.originalNormalisedName === data.name) ?? (entity.normalizedName === data.name);
          if (!nameMatch) return false;
          for (const [field, value] of Object.entries(matchedProperties)) {
            if (foundry.utils.getProperty(entity, field) !== value) return false;
          }
          return true;
        });
        if (entry) {
          const i = {
            _id: entry._id,
            name: data.restriction ? `${entry.name} (${data.restriction})` : entry.name,
            uuid: entry.uuid,
            img: entry.img,
          };
          for (const field of matchedPropertiesKeys) {
            foundry.utils.setProperty(i, field, foundry.utils.getProperty(entry, field));
          }
          return i;
        } else {
          return null;
        }
      });

    if (getDocuments) {
      // replace non-null values with the complete entity from the compendium
      let entities = await Promise.all(
        indices.map((entry) => {
          return new Promise((resolve) => {
            if (entry) {
              compendium.getDocument(entry._id).then((entity) => {
                entity.name = entry.name; // transfer restrictions over, if any
                // remove redudant info
                delete entity.id;
                // delete entity._id;
                delete entity.ownership;
                resolve(entity);
              });
            } else {
              resolve(null);
            }
          });
        }),
      );
      return entities;
    }
    return indices;
  },

  /**
   * Queries a compendium for a given document name
   * @param {string} compendiumName the name of the compendium to query
   * @param {string} documentName the name of the document to search for
   * @param {boolean} getDocument if true, returns the document entity, otherwise the index entry
   * @returns {object|null} the index entries of all matches, otherwise an empty array
   */
  queryCompendium: async (compendiumName, documentName, getDocument = false) => {
    documentName = utils.normalizeString(documentName);

    let compendium = game.packs.get(compendiumName);
    if (!compendium) return null;
    let index = await compendium.getIndex();
    let id = index.find((entity) => utils.normalizeString(entity.name) === documentName);
    if (id && getDocument) {
      let entity = await compendium.getEntity(id._id);
      return entity;
    }
    return id ? id : null;
  },

  /**
   * Queries a compendium for a list of items, returning the matching documents.
   * @param {string[]|{name: string}[]} documents an array of strings or objects with a "name" property
   * @param {string} compendiumName the name of the compendium to query
   * @param {object} matchedProperties an object containing properties and values to match in the index
   * @returns {object[]} the matching documents, or an empty array if none are found.
   */
  async retrieveMatchingCompendiumItems(documents, compendiumName, matchedProperties = {}) {
    const documentNames = documents.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "name")) return item.name;
      return "";
    });

    const results = await CompendiumHelper.queryCompendiumEntries({
      compendiumName,
      documentNames,
      getDocuments: true,
      matchedProperties,
    });
    const cleanResults = results.filter((item) => item !== null);

    return cleanResults;
  },

  async createFolder({
    pack, name, parentId = null, color = "", folderId = null, flagTag = "", flags = {}, entityType,
  } = {}) {
    logger.debug("Finding folder", {
      folders: pack.folders,
      name,
      flagTag,
      folderId,
      entityType,
      parentId,
    });
    const existingFolder = pack.folders.find((f) =>
      f.name === name
      && flagTag === f.flags?.ddbimporter?.flagTag
      && (parentId === null
        || (parentId === f.folder?._id)
      ),
    );
    if (existingFolder) return existingFolder;

    logger.debug(`Creating folder ${name}`, {
      folders: pack.folders,
      parentId,
      flagTag,
    });

    const newFolder = await Folder.create({
      _id: folderId,
      name,
      color,
      type: entityType,
      folder: parentId,
      flags: {
        ddbimporter: foundry.utils.mergeObject({ flagTag }, flags),
      },
    }, { pack: pack.metadata.id, keepId: true });

    return newFolder;
  },

  async retrieveCompendiumSpellReferences(spellNames, { use2024Spells = false } = {}) {
    const compendiumName = await game.settings.get(SETTINGS.MODULE_ID, "entity-spell-compendium");

    const results = await CompendiumHelper.queryCompendiumEntries({
      compendiumName,
      documentNames: spellNames,
      getDocuments: false,
      matchedProperties: {
        "system.source.rules": use2024Spells ? "2024" : "2014",
      },
    });
    const cleanResults = results.filter((item) => item !== null);

    return cleanResults;
  },

  getCompendiumLookups(type, selected) {
    const excludedCompendiumPackages = [
      "dnd5e",
      "dae",
      "midiqol",
      "magicitems",
      "midi-srd",
      "dae-srd",
      "midi-qol",
      "magic-items-2",
      "chris-premades",
      "ATL",
      "ActiveAuras",
      "auraeffects",
      "token-attacher",
    ];

    const selections = game.packs
      .filter((pack) =>
        pack.documentName === type
      && !excludedCompendiumPackages.includes(pack.metadata.packageName),
      )
      .reduce((choices, pack) => {
        choices[pack.collection] = {
          label: `[${pack.metadata.packageName}] ${pack.metadata.label}`,
          selected: pack.collection === selected,
        };
        return choices;
      }, {});

    return selections;
  },


};

export default CompendiumHelper;

