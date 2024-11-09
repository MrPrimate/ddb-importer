import { logger, utils, DDBItemImporter } from "./_module.mjs";
import SETTINGS from '../settings.js';

const CompendiumHelper = {

  // a mapping of compendiums with content type
  LOOKUP: [
    { type: "adventure", compendium: "entity-adventure-compendium" },
    { type: "adventures", compendium: "entity-adventure-compendium" },
    { type: "background", compendium: "entity-background-compendium" },
    { type: "backgrounds", compendium: "entity-background-compendium" },
    { type: "class", compendium: "entity-class-compendium" },
    { type: "classes", compendium: "entity-class-compendium" },
    { type: "classfeatures", compendium: "entity-feature-compendium" },
    { type: "consumable", compendium: "entity-item-compendium" },
    { type: "container", compendium: "entity-item-compendium" },
    { type: "custom", compendium: "entity-override-compendium" },
    { type: "equipment", compendium: "entity-item-compendium" },
    { type: "feat", compendium: "entity-feature-compendium" },
    { type: "feats", compendium: "entity-feat-compendium" },
    { type: "feature", compendium: "entity-feature-compendium" },
    { type: "features", compendium: "entity-feature-compendium" },
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
    { type: "race", compendium: "entity-race-compendium" },
    { type: "races", compendium: "entity-race-compendium" },
    { type: "RollTable", compendium: "entity-table-compendium" },
    { type: "spell", compendium: "entity-spell-compendium" },
    { type: "spell", compendium: "entity-spell-compendium" },
    { type: "spells", compendium: "entity-spell-compendium" },
    { type: "subclass", compendium: "entity-subclass-compendium" },
    { type: "subclasses", compendium: "entity-subclass-compendium" },
    { type: "summon", compendium: "entity-summons-compendium" },
    { type: "summons", compendium: "entity-summons-compendium" },
    { type: "table", compendium: "entity-table-compendium" },
    { type: "tables", compendium: "entity-table-compendium" },
    { type: "tool", compendium: "entity-item-compendium" },
    { type: "trait", compendium: "entity-trait-compendium" },
    { type: "traits", compendium: "entity-trait-compendium" },
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
      if (!updateImages && existingNPC.system.img !== CONST.DEFAULT_TOKEN) {
        foundryActor.img = existingNPC.system.img;
      }
      if (!updateImages && foundry.utils.getProperty(existingNPC, "prototypeToken.texture.src") !== CONST.DEFAULT_TOKEN) {
        foundryActor.prototypeToken.texture.src = existingNPC.prototypeToken.texture.src;
        foundryActor.prototypeToken.scale = existingNPC.prototypeToken.scale;
        foundryActor.prototypeToken.randomImg = existingNPC.prototypeToken.randomImg;
        foundryActor.prototypeToken.mirrorX = existingNPC.prototypeToken.mirrorX;
        foundryActor.prototypeToken.mirrorY = existingNPC.prototypeToken.mirrorY;
        foundryActor.prototypeToken.lockRotation = existingNPC.prototypeToken.lockRotation;
        foundryActor.prototypeToken.rotation = existingNPC.prototypeToken.rotation;
        foundryActor.prototypeToken.alpha = existingNPC.prototypeToken.alpha;
        foundryActor.prototypeToken.lightAlpha = existingNPC.prototypeToken.lightAlpha;
        foundryActor.prototypeToken.lightAnimation = existingNPC.prototypeToken.lightAnimation;
        foundryActor.prototypeToken.tint = existingNPC.prototypeToken.tint;
        foundryActor.prototypeToken.lightColor = existingNPC.prototypeToken.lightColor;
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
    const monsterIndexFields = ["name", "flags.ddbimporter.id"];
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

  /**
   * Checks if a compendium exists with the given id or label, if not, creates a new one.
   * @param {object} options
   * @param {string} options.label Label of compendium to find
   * @param {string} options.type Name of compendium
   * @param {string} [options.id] Id of compendium, optional, used in place of label to find compendium
   * @param {string} [options.packageType] package type of compendium, defaults to world
   * @param {string} [options.folderId] folder id for compendium
   * @param {string[]} [options.dnd5eTypeTags] dnd5e type tags for compendium
   * @returns {object} Object consisting of compendium and creation result
   */
  // eslint-disable-next-line no-unused-vars
  createIfNotExists: async ({ label, type, id = undefined, packageType = "world", folderId = null, dnd5eTypeTags = [] } = {}) => {
    if (id) logger.debug(`Checking if Compendium with id ${id} exists for ${SETTINGS.MODULE_ID}`);
    else if (label) logger.debug(`Checking if Compendium with label ${label} exists for ${SETTINGS.MODULE_ID}`);
    const compendium = await game.packs.get(id) ?? game.packs.find((p) => p.metadata.label === label);
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
        const newCompendium = await CompendiumCollection.createCompendium({
          type,
          label,
          name,
          package: packageType,
          // flags: {
          //   dnd5e: {
          //     types: dnd5eTypeTags,
          //   }
          // }
        });
        if (folderId) await newCompendium.setFolder(folderId);
        return {
          compendium: newCompendium,
          created: true,
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
   * Queries a compendium for multiple documents by their names.
   * Returns either the index entries of the documents or the complete documents.
   *
   * @param {string} compendiumName The name of the compendium to query.
   * @param {string[]} documentNames An array of document names to query.
   * @param {boolean} [getDocuments=false] If true, returns the complete documents from the compendium. Defaults to false.
   * @returns {Promise<Array<object|null>>} A promise that resolves to an array of index entries or complete documents.
   *                                          Returns null for documents that are not found.
   */
  queryCompendiumEntries: async (compendiumName, documentNames, getDocuments = false) => {
    // get the compendium
    let compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    let index = await compendium.getIndex();
    index = index.map((entry) => {
      entry.normalizedName = utils.normalizeString(entry.name);
      return entry;
    });

    // get the indices of all the entitynames, filter un
    let indices = documentNames
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
   * @param {string[]|{name: string}[]} items an array of strings or objects with a "name" property
   * @param {string} compendiumName the name of the compendium to query
   * @returns {object[]} the matching documents, or an empty array if none are found.
   */
  async retrieveMatchingCompendiumItems(items, compendiumName) {
    const GET_ENTITY = true;

    const itemNames = items.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "name")) return item.name;
      return "";
    });

    const results = await CompendiumHelper.queryCompendiumEntries(compendiumName, itemNames, GET_ENTITY);
    const cleanResults = results.filter((item) => item !== null);

    return cleanResults;
  },


};

export default CompendiumHelper;
