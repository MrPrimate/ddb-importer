import logger from "./Logger";
import utils from "./Utils";
import DDBItemImporter from "./DDBItemImporter";
import FileHelper from "./FileHelper";
import { SETTINGS } from "../config/_module";
import { createDDBCompendium } from "../hooks/ready/checkCompendiums";

export interface ICompendiumCreationOptions {
  label?: string;
  type?: string;
  id?: string;
  packageType?: string;
  folderId?: string | null;
  dnd5eTypeTags?: string[];
  version?: number | null;
  image?: string | null;
  title?: string;
}

// a mapping of compendiums with content type
export const COMPENDIUM_LOOKUP = [
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
] as const;

const CompendiumHelper = {

  LOOKUP: COMPENDIUM_LOOKUP,

  getCompendiumLabel: (type: TCompendiumTypes): string => {
    const lookup = CompendiumHelper.LOOKUP.find((c) => c.type === type);
    if (!lookup) {
      logger.error(`No compendium mapping exists for type "${type}"`);
      throw new Error(`No DDB Importer compendium mapping exists for type "${type}"`);
    }
    return utils.getSetting<string>(lookup.compendium);
  },

  getCompendium: (label: string, fail = true) => {
    const compendium = game.packs.get(label);
    if (compendium) {
      return compendium;
    } else {
      if (fail) {
        logger.error(`Unable to find compendium ${label}`);
        ui.notifications.error(`Unable to open the Compendium ${label}. Check the compendium exists and is set in "Module Settings > DDB Importer > Core Settings > Compendiums"`);
        throw new Error(`Unable to open the Compendium ${label}. Check the compendium exists and is set in "Module Settings > DDB Importer > Core Settings > Compendiums".`);
      } else {
        logger.info(`Unable to find compendium ${label}`);
      }
      return undefined;
    }
  },

  getCompendiumType: (type: TCompendiumTypes, fail = true): CompendiumCollection.Any | undefined => {
    const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
    logger.debug(`Getting compendium ${compendiumLabel} for update of ${type}`);
    const compendium = CompendiumHelper.getCompendium(compendiumLabel, fail);
    if (!compendium) {
      logger.info(`Unable to open compendium, skipping compendium ${compendiumLabel} for ${type} integration`);
    }
    return compendium;
  },

  loadCompendiumIndex: async (type: TCompendiumTypes, indexOptions = {}) => {
    const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
    foundry.utils.setProperty(CONFIG.DDBI, `compendium.label.${type}`, compendiumLabel);
    const compendium = CompendiumHelper.getCompendium(compendiumLabel);

    if (compendium) {
      const index = await compendium.getIndex(indexOptions);
      foundry.utils.setProperty(CONFIG.DDBI, `compendium.index.${type}`, index);
      return index;
    } else {
      return undefined;
    }
  },

  copyExistingActorProperties: async (type: TCompendiumTypes, foundryActor: I5eActorData) => {
    const compendium = CompendiumHelper.getCompendiumType(type);

    if (utils.getSetting<boolean>("munching-policy-update-existing")) {
      if (!compendium || !foundryActor._id) {
        logger.warn("Unable to copy existing actor properties, missing compendium or actor id", { type, actorId: foundryActor._id });
        return foundryActor;
      }
      const existingNPC = await compendium.getDocument(foundryActor._id) as Actor.Implementation;

      const updateImages = utils.getSetting<boolean>("munching-policy-update-images");
      if (!updateImages && !utils.isDefaultOrPlaceholderImage(foundry.utils.getProperty(existingNPC, "system.img") as string)) {
        foundryActor.img = foundry.utils.getProperty(existingNPC, "system.img") as string;
      }
      if (!updateImages && !utils.isDefaultOrPlaceholderImage(foundry.utils.getProperty(existingNPC, "prototypeToken.texture.src") as string)) {
        const oldValues = foundry.utils.duplicate(existingNPC.prototypeToken) as unknown as I5ePrototypeToken;
        delete oldValues.name;
        delete oldValues.sight;
        delete oldValues.light;
        foundryActor.prototypeToken = foundry.utils.mergeObject(foundryActor.prototypeToken ?? {}, oldValues) as I5ePrototypeToken;
      }

      const retainBiography = utils.getSetting<boolean>("munching-policy-monster-retain-biography");
      if (retainBiography && foundryActor.system.details) {
        foundryActor.system.details.biography = foundry.utils.getProperty(existingNPC, "system.details.biography") as I5eBiography;
      }

      DDBItemImporter.copySupportedItemFlags(existingNPC.toObject() as unknown as Item.Implementation, foundryActor);
    }

    return foundryActor;

  },

  getActorIndexActor: async (type: TCompendiumTypes, npc: I5eMonsterData | I5ePCData | I5eVehicleData) => {
    const monsterIndexFields = ["name", "flags.ddbimporter.id", "system.source.rules"];
    const legacyName = utils.getSetting<boolean>("munching-policy-legacy-postfix");
    const index = await CompendiumHelper.loadCompendiumIndex(type, { fields: monsterIndexFields });
    if (!index) return undefined;
    const npcMatch = index.contents.find((entity) => {
      const entityName = (foundry.utils.getProperty(entity, "name") as string).toLowerCase();
      return foundry.utils.hasProperty(entity, "flags.ddbimporter.id")
        && foundry.utils.getProperty(entity, "flags.ddbimporter.id") == foundry.utils.getProperty(npc, "flags.ddbimporter.id")
        && ((!legacyName && entityName === npc.name.toLowerCase())
          || (legacyName && foundry.utils.getProperty(npc, "flags.ddbimporter.isLegacy") && npc.name.toLowerCase().startsWith(entityName))
          || (legacyName && entityName === npc.name.toLowerCase()));
    });
    return npcMatch;
  },

  existingActorCheck: async (type: TCompendiumTypes, foundryActor: I5eMonsterData | I5ePCData | I5eVehicleData): Promise<I5eMonsterData | I5ePCData | I5eVehicleData> => {
    const matchingActor = await CompendiumHelper.getActorIndexActor(type, foundryActor);
    if (matchingActor) {
      logger.debug(`Found existing ${type}, updating: ${matchingActor.name}`);
      foundryActor._id = matchingActor._id;
      foundryActor = await CompendiumHelper.copyExistingActorProperties(type, foundryActor);
    } else {
      logger.debug(`No existing compendium match for ${foundryActor.name}`);
    }
    return foundryActor as I5eMonsterData | I5ePCData | I5eVehicleData;
  },

  sanitize: (text: string) => {
    if (text && typeof text === "string") {
      return text.replace(/\s|\./g, "-").toLowerCase();
    }
    return text;
  },

  getDefaultCompendiumName: (compendiumLabel: string) => {
    const sanitizedLabel = CompendiumHelper.sanitize(compendiumLabel);
    const name = `ddb-${game.world.id}-${sanitizedLabel}`;
    return name;
  },

  async getCompendiumBannerImage(url: string, name: string | undefined) {
    const targetDirectory = utils.getSetting<string>("persistent-storage-location").replace(/^\/|\/$/g, "");

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dnd5eTypeTags = [],
    version = null,
    image = null,
    title,
  }: ICompendiumCreationOptions) => {
    if (id) logger.debug(`Checking if Compendium with id ${id} exists for ${SETTINGS.MODULE_ID} in ${folderId}`);
    else if (label) logger.debug(`Checking if Compendium with label ${label} exists for ${SETTINGS.MODULE_ID} in ${folderId}`);
    const compendium = (id ? await game.packs.get(id) : undefined) ?? game.packs.find((p) => p.metadata.label === label);
    if (compendium) {
      logger.debug(`Compendium '${id}' (${compendium.metadata.label}) found, will not create compendium.`);
      return {
        compendium,
        created: false,
      };
    } else {
      logger.info(`Compendium for ${label}, was not found, creating it now.`);
      if (!label) throw new Error("A label is required to create a new DDB Importer compendium");
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
        const CompendiumClass = foundry.documents?.collections?.CompendiumCollection;
        const newCompendium = await CompendiumClass.createCompendium({
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
        } as unknown as Parameters<typeof CompendiumClass.createCompendium>[0]);
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
      return utils.getSetting<string>(ddbCompendium.setting);
    });
  },

  deleteDefaultCompendiums: async (force = true) => {
    if (!force) {
      logger.warn("Pass 'true' to this function to force deletion.");
    }
    await game.settings.set(SETTINGS.MODULE_ID, "auto-create-compendium", false);

    const clone = foundry.utils.deepClone(SETTINGS.DEFAULT_SETTINGS);
    const compendiumSettings = SETTINGS.APPLY_GLOBAL_DEFAULTS(clone.READY.COMPENDIUMS);

    for (const [name, data] of Object.entries(compendiumSettings)) {
      const compendiumName = CompendiumHelper.getDefaultCompendiumName(data.default);
      const pack = game.packs.get(`world.${compendiumName}`);
      if (pack) {
        logger.warn(`Setting: ${name} : Deleting compendium ${data.name} with key world.${compendiumName}}`);
        await pack.deleteCompendium();
      }
    }
  },


  /**
   * Queries a compendium for a single document. Returns either the entry from the index, or the complete document
   * @param {string} compendiumName The name of the compendium to query
   * @param {string} documentName The name of the document to query
   * @param {boolean} getDocument If true, returns the complete document from the compendium. Defaults to false.
   * @returns {object|null} The entry from the index, or the complete document if getDocument is true. Null if no match.
   */
  queryCompendiumEntry: async (compendiumName: string, documentName: string, getDocument = false): Promise<object | null> => {
    // normalize the entity name for comparison
    documentName = utils.normalizeString(documentName);

    // get the compendium
    const compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    const index = await compendium.getIndex();

    const id = index.find((entity) => utils.normalizeString(entity.name ?? "") === documentName);
    if (id && getDocument) {
      const entity = await compendium.getDocument(id._id);
      return entity;
    }
    return id ? id : null;
  },

  /**
   * Queries a compendium for multiple documents based on their names.
   *
   * @param {object} options The options object.
   * @param {string} options.compendiumName The name of the compendium to query.
   * @param {string[]} options.documentNames An array of document names to query.
   * @param {Record<string, any>} [options.matchedProperties={}] An object of properties to match in the index.
   * @param {boolean} [options.useParenthesisMatch=false] If true, uses parentheses to match the document name.
   * @returns {Promise<Array<object|null>>} A promise that resolves to an array of document entries or complete documents.
   *                                        Returns null for documents that are not found.
   */
  queryCompendiumEntries: async ({
    compendiumName, documentNames, matchedProperties = {}, useParenthesisMatch = true,
  }: {
    compendiumName: string;
    documentNames: string[];
    matchedProperties?: Record<string, any>;
    useParenthesisMatch?: boolean;
  }): Promise<(ICompendiumLookup | null)[] | null> => {
    // get the compendium
    const compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // retrieve the compendium index
    const matchedPropertiesKeys = Object.keys(matchedProperties);
    const fields = ["name", "flags.ddbimporter.originalName", ...matchedPropertiesKeys];
    const rawIndex = await compendium.getIndex({ fields });
    const index = rawIndex.map((entry: any) => {
      entry.normalizedName = utils.normalizeString(entry.name);
      entry.originalNormalisedName = utils.normalizeString(entry.flags?.ddbimporter?.originalName ?? entry.name);
      return entry;
    });

    // get the indices of all the entitynames, filter un
    const indices: (ICompendiumLookup | null)[] = documentNames
      .map((entityName) => {
        // sometimes spells do have restricted use in paranthesis after the name. Let's try to find those restrictions and add them later
        const match = useParenthesisMatch ? entityName.match(/(.+)\(([^()]+)\)*/) : null;
        if (match) {
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
        const entry = index.find((entity) => {
          const nameMatch = (entity.originalNormalisedName === data.name) || (entity.normalizedName === data.name);
          if (!nameMatch) return false;
          for (const [field, value] of Object.entries(matchedProperties)) {
            if (foundry.utils.getProperty(entity, field) !== value) return false;
          }
          return true;
        });
        if (entry) {
          const i: ICompendiumLookup = {
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
    return indices;
  },

  /**
   * Queries a compendium for multiple documents based on their names.
   * It retrieves the complete document from the compendium.
   *
   * @param {object} options The options object.
   * @param {string} options.compendiumName The name of the compendium to query.
   * @param {string[]} options.documentNames An array of document names to query.
   * @param {Record<string, any>} [options.matchedProperties={}] An object of properties to match in the index.
   * @param {boolean} [options.useParenthesisMatch=false] If true, uses parentheses to match the document name.
   * @returns {Promise<Array<object|null>>} A promise that resolves to an array of document entries or complete documents.
   *                                        Returns null for documents that are not found.
   */
  queryCompendiumEntriesDocuments: async ({
    compendiumName, documentNames, matchedProperties = {}, useParenthesisMatch = true,
  }: {
    compendiumName: string;
    documentNames: string[];
    matchedProperties?: Record<string, any>;
    useParenthesisMatch?: boolean;
  }): Promise<(T5eCompendiumDocuments | null)[] | null> => {
    // get the compendium
    const compendium = game.packs.get(compendiumName);
    if (!compendium) return null;

    // get the indices of all the entitynames, filter un
    const indices = await CompendiumHelper.queryCompendiumEntries({
      compendiumName,
      documentNames,
      matchedProperties,
      useParenthesisMatch,
    });
    if (!indices) return null;

    // replace non-null values with the complete entity from the compendium
    const entities = await Promise.all(
      indices.map((entry) => {
        return new Promise<T5eCompendiumDocuments | null>((resolve) => {
          if (entry) {
            compendium.getDocument(entry._id).then((entity) => {
              const doc = entity.toObject() as unknown as T5eCompendiumDocuments;
              doc.name = entry.name; // transfer restrictions over, if any
              // remove redundant info
              // delete doc.id;
              // delete doc._id;
              delete doc.ownership;
              resolve(doc);
            });
          } else {
            resolve(null);
          }
        });
      }),
    );
    return entities;
  },

  /**
   * Queries a compendium for a list of items, returning the matching documents.
   * @param {string[]|{name: string}[]} documents an array of strings or objects with a "name" property
   * @param {string} compendiumName the name of the compendium to query
   * @param {object} matchedProperties an object containing properties and values to match in the index
   * @returns {object[]} the matching documents, or an empty array if none are found.
   */
  async retrieveMatchingCompendiumItems(
    documents: (string | { name: string })[],
    compendiumName: string,
    matchedProperties: Record<string, any> = {},
  ): Promise<(T5eCompendiumDocuments)[]> {
    const documentNames = documents.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "name")) return item.name;
      return "";
    });

    const results = await CompendiumHelper.queryCompendiumEntriesDocuments({
      compendiumName,
      documentNames,
      matchedProperties,
    });
    if (!results) return [];
    const cleanResults = results.filter((item): item is T5eCompendiumDocuments => item !== null);

    return cleanResults;
  },

  async createFolder({
    pack, name, parentId = null, color = "", folderId = null, flagTag = "", flags = {}, entityType,
  }: {
    pack?: CompendiumCollection.Any;
    name?: string;
    parentId?: string | null;
    color?: string | null;
    folderId?: string | null;
    flagTag?: string;
    flags?: Record<string, any>;
    entityType?: string;
    // foundry-vtt-types' Folder union hides _id on some members; callers read it
  } = {}): Promise<{ _id: string; name: string } & Folder> {
    if (!pack) throw new Error(`Unable to create the folder "${name}", no compendium pack was provided`);
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
      && flagTag === foundry.utils.getProperty(f, "flags.ddbimporter.flagTag")
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
    } as unknown as Folder.CreateInput, { pack: pack.metadata.id, keepId: true });

    if (!newFolder) throw new Error(`Unable to create the folder "${name}" in pack "${pack.metadata.id}"`);
    return newFolder as { _id: string; name: string } & Folder;
  },

  async retrieveCompendiumSpellReferences(spellNames: string[], { use2024Spells = false } = {}) {
    const compendiumName = utils.getSetting<string>("entity-spell-compendium");

    const results = await CompendiumHelper.queryCompendiumEntries({
      compendiumName,
      documentNames: spellNames,
      matchedProperties: {
        "system.source.rules": use2024Spells ? "2024" : "2014",
      },
    });
    if (!results) return [];
    const cleanResults = results.filter((item): item is ICompendiumLookup => item !== null);

    return cleanResults;
  },

  getConfiguredCompendiums(): IConfiguredCompendium[] {
    return SETTINGS.COMPENDIUMS.map((comp) => {
      const settingValue = utils.getSetting<string>(comp.setting);
      const pack = game.packs.get(settingValue);
      return {
        setting: comp.setting,
        title: comp.title,
        type: comp.type,
        auto: comp.auto,
        settingValue,
        pack,
        comp,
      };
    });
  },

  async emptyCompendiums(selectedSettings: string[]) {
    const configured = CompendiumHelper.getConfiguredCompendiums();
    let count = 0;
    for (const entry of configured) {
      if (!selectedSettings.includes(entry.setting) || !entry.pack) continue;
      logger.info(`Emptying compendium ${entry.pack.metadata.label}`);
      await entry.pack.documentClass.deleteDocuments([], { pack: entry.pack.metadata.id, deleteAll: true });
      count++;
    }
    return count;
  },

  getDeleteRecreateInfo(): IDeleteRecreateInfo {
    const configured = CompendiumHelper.getConfiguredCompendiums();
    const worldCompendiums: IWorldCompendium[] = [];
    const skippedCompendiums: ISkippedCompendium[] = [];

    for (const entry of configured) {
      if (!entry.pack) {
        skippedCompendiums.push({ ...entry, reason: "not found" });
        continue;
      }
      if (entry.pack.metadata.packageType !== "world") {
        skippedCompendiums.push({ ...entry, reason: "module/system compendium" });
        continue;
      }
      const defaultName = `DDB ${entry.title}`;
      const isDefault = entry.settingValue === defaultName
        || entry.settingValue === entry.pack.metadata.id;
      worldCompendiums.push({ ...entry, pack: entry.pack, isDefault });
    }

    const nonDefaultCompendiums = worldCompendiums.filter((c) => !c.isDefault);
    return { worldCompendiums, skippedCompendiums, nonDefaultCompendiums };
  },

  async deleteAndRecreateCompendiums(compendiumSettings: IWorldCompendium[]) {
    let count = 0;
    for (const entry of compendiumSettings) {
      if (!entry.pack) continue;
      logger.warn(`Deleting compendium ${entry.pack.metadata.label} (${entry.pack.metadata.id})`);
      await entry.pack.deleteCompendium();
      logger.info(`Recreating compendium for ${entry.title}`);
      await createDDBCompendium(entry.comp);
      count++;
    }
    return count;
  },

  async recreateMissingCompendiums() {
    const configured = CompendiumHelper.getConfiguredCompendiums();
    const recreated = [];
    for (const entry of configured) {
      if (entry.pack) continue;
      logger.info(`Compendium for ${entry.title} is missing, recreating`);
      await createDDBCompendium(entry.comp);
      recreated.push(entry.title);
    }
    return recreated;
  },

  getCompendiumLookups(type: string, selected: string) {
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
      "dnd-forge-artificer",
      "dnd-heroes",
      "dnd-monster-manual",
      "dnd-tashas-cauldron",
      "dnd-players-handbook",
    ];

    const packChoices = game.packs
      .filter((pack) =>
        pack.locked === false
        && pack.documentName === type
      && !excludedCompendiumPackages.includes(pack.metadata.packageName),
      )
      .reduce((choices: Record<string, any>, pack) => {
        choices[pack.collection] = {
          label: `[${pack.metadata.packageName}] ${pack.metadata.label}`,
          selected: pack.collection === selected,
        };
        return choices;
      }, {});

    const hasSelection = Object.values(packChoices).some((s: any) => s.selected);
    const selections = {
      "": {
        label: "- None -",
        selected: !hasSelection,
      },
      ...packChoices,
    };

    return selections;
  },


};

export default CompendiumHelper;

