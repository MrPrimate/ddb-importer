import { DICTIONARY } from "../config/_module";
import utils from "./Utils";
import logger from "./Logger";
import CompendiumHelper from "./CompendiumHelper";
import DDBSources from "./DDBSources";

interface ICompendiumFolderCreateOptions {
  name?: string;
  parentId?: string | null;
  color?: string | null;
  folderId?: string | null;
  flagTag?: string;
}

interface ICompendiumFolderTypeDefinition {
  folderName: string;
  color?: string;
  subFolders?: Record<string, ICompendiumFolderTypeDefinition>;
}

interface IItemTypeFolderOptions {
  folderName?: string;
  type?: string;
  color?: string | null;
  bookCode?: string;
  categoryId?: number;
  // categoryId?: number | string;
  categoryFolderId?: string | null;
  sourceFolderId?: string | null;
  createSubFolder?: boolean;
  subFolderName?: string;
  // subKey?: string | number;
  subKey?: string;
  flagList?: Set<string> | null;
  subFolderColor?: string | null;
}

interface ISourceFolderNameOptions {
  bookCode?: string;
  isLegacy?: boolean;
  type?: string;
  noSourceNameOverride?: string | null;
  nameSuffix?: string;
  flagSuffix?: string | null;
  // flagSuffix?: string | number;
}

interface ISourceCategoryFolderNameOptions extends ISourceFolderNameOptions {
  categoryId?: number;
  // categoryId?: number | string;
}

interface ISourceFolderNameFromDocumentOptions {
  document?: T5eCompendiumDocuments;
  type?: string;
  noSourceNameOverride?: string | null;
  nameSuffix?: string;
  flagSuffix?: string | null;
  // flagSuffix?: string | number;
  // getFeatFolderName passes a stray `suffix` argument that is never destructured
  suffix?: string;
}

interface ICreatureTypeFolderOptions {
  categoryFolderKey?: number;
  // categoryFolderKey?: number | string;
  categoryFolderId?: string | null;
  monsterType?: { name: string };
}

interface IChallengeRatingFolderOptions {
  // categoryFolderKey?: number | string;
  categoryFolderKey?: number;
  categoryFolderId?: string | null;
  cr?: string | number;
}

interface ISpellLevelFolderOptions {
  levelName?: string;
  categoryFolderKey?: number;
  // categoryFolderKey?: number | string;
  categoryFolderId?: string | null;
}

interface IFolderKeyData {
  key?: string;
  folder?: Folder;
  subFolders: Record<string, IFolderKeyData>;
}

interface IGenerateFolderFromDataOptions {
  sourceKey?: string;
  parentKeyData?: IFolderKeyData;
  parentKey?: string;
  flagPrefix?: string;
  data?: ICompendiumFolderTypeDefinition;
}

export class DDBCompendiumFolders {

  // populated by loadCompendium() before folder operations read it
  compendium!: CompendiumCollection.Any;
  type: TCompendiumTypes;
  packName: string | null;
  compendiumFolderTypeMonster: string;
  compendiumFolderTypeSpell: string;
  compendiumFolderTypeItem: string;
  validFolderIds: string[] = [];
  classFolders: Record<string, string> = {};
  subClassFeaturesFolder: Record<string, string> = {};
  backgroundFolders: Record<string, Folder> = {};
  vehicleFolders: Record<string, Folder> = {};
  entityTypes: Map<string, string>;
  entityType: TCompendiumEntityType;

  static DDB_COLOR = "#6f0006";

  static SCHEMA_SUPPORT = {
    "feature": 2,
    "class": 2,
    "race": 2,
    "trait": 2,
    "subclass": 2,
    "feat": 2,
  };

  resetFolderLookups() {
    this.validFolderIds = [];
    this.classFolders = {};
    this.subClassFeaturesFolder = {};
    this.backgroundFolders = {};
    this.vehicleFolders = {};
  }

  constructor(type: TCompendiumTypes, { packName = null as string | null } = {}) {
    this.type = type;
    this.packName = packName;
    this.resetFolderLookups();

    this.entityTypes = utils.entityMap();
    this.entityType = this.entityTypes.get(type) as TCompendiumEntityType;

    this.compendiumFolderTypeMonster = utils.getSetting<string>("munching-selection-compendium-folders-monster");
    this.compendiumFolderTypeSpell = utils.getSetting<string>("munching-selection-compendium-folders-spell");
    this.compendiumFolderTypeItem = utils.getSetting<string>("munching-selection-compendium-folders-item");
  }

  async addCompendiumFolderIds(documents: T5eCompendiumDocuments[]): Promise<T5eCompendiumDocuments[]> {
    const results = documents.map(async (d) => {
      const folderId = await this.getFolderId(d);
      if (folderId) d.folder = folderId;
      return d;
    });
    return Promise.all(results);
  }

  async loadCompendium(type: TCompendiumTypes | null = null, noCreate = true) {
    if (type) {
      this.packName = await CompendiumHelper.getCompendiumLabel(type);
      this.entityType = this.entityTypes.get(type) as TCompendiumEntityType;
    }
    if (!this.packName) throw new Error(`Unable to load compendium for ${this.type}, no pack name is set`);
    const compendium = CompendiumHelper.getCompendium(this.packName);
    if (!compendium) throw new Error(`Unable to load compendium ${this.packName}`);
    this.compendium = compendium;
    if (!noCreate) await this.createCompendiumFolders();
  }

  _createCompendiumFolderData({ name, parentId = null, color = "", folderId = null, flagTag = "" }: ICompendiumFolderCreateOptions = {}) {
    return {
      pack: this.compendium,
      name,
      parentId,
      color,
      folderId,
      flagTag,
      entityType: this.entityType,
    };
  }

  async createCompendiumFolder({ name, parentId, color, folderId, flagTag }: ICompendiumFolderCreateOptions = {}) {
    const data = this._createCompendiumFolderData({ name, parentId, color, folderId, flagTag });
    const folder = await CompendiumHelper.createFolder(data);
    return folder;
  }

  async createCreatureTypeFolder({ categoryFolderKey = undefined, categoryFolderId = undefined, monsterType }: ICreatureTypeFolderOptions = {}) {
    if (!monsterType) throw new Error("createCreatureTypeFolder requires a monsterType");
    const flagTag = categoryFolderId
      ? DDBCompendiumFolders.getSourceCategoryFolderName({
        categoryId: categoryFolderKey,
        type: "monster",
      }).flagTag
      : "";
    const folder = this.getFolder(monsterType.name, flagTag)
      ?? (await this.createCompendiumFolder({
        name: monsterType.name,
        color: categoryFolderId ? "" : DDBCompendiumFolders.DDB_COLOR,
        flagTag,
        parentId: categoryFolderId,
      }));
    this.validFolderIds.push(folder._id);
  }

  async createCreatureTypeFolders({ categoryFolderKey = undefined, categoryFolderId = undefined }: ICreatureTypeFolderOptions = {}) {
    for (const monsterType of CONFIG.DDB.monsterTypes) {
      await this.createCreatureTypeFolder({ categoryFolderKey, categoryFolderId, monsterType });
    }
  }

  static getCreatureDDBType(document: I5eMonsterData) {
    const creatureType = document.system?.details?.type?.value ?? "Unknown";
    const ddbType = CONFIG.DDB.monsterTypes.find((c) => creatureType.toLowerCase() == c.name.toLowerCase())
      ?? { name: "Unknown" };

    return ddbType;
  }

  static getCreatureTypeFolderNameForTypeSourceCategory(document: I5eMonsterData) {
    const ddbType = DDBCompendiumFolders.getCreatureDDBType(document);

    const result = DDBCompendiumFolders.getSourceCategoryFolderNameFromDocument({
      type: "monster",
      document,
      nameSuffix: ddbType ? ddbType.name : "Unknown",
    });
    return {
      result,
      name: result.name,
      flagTag: result.flagTag,
    };
  }

  async createCreatureTypeFoldersWithSourceCategories() {
    const sourceFoldersData = DDBCompendiumFolders.getAllSourceCategoryFolders("monster");

    for (const data of sourceFoldersData) {
      const sourceFolder = await this._createSourceFolder(data.name, data.flagTag, data.color);

      await this.createCreatureTypeFolders({
        categoryFolderKey: data.categoryId,
        categoryFolderId: sourceFolder._id,
      });
    }
  }

  async createAlphabeticalFolders() {
    for (let i = 9; ++i < 36;) {
      const folderName = i.toString(36).toUpperCase();
      const folder = this.getFolder(folderName)
        ?? (await this.createCompendiumFolder({ name: folderName, color: DDBCompendiumFolders.DDB_COLOR }));
      this.validFolderIds.push(folder._id);
    }
  }

  async createChallengeRatingFolder({ categoryFolderKey = undefined, categoryFolderId = undefined, cr = "0" }: IChallengeRatingFolderOptions = {}) {
    const paddedCR = String(cr).padStart(2, "0");
    const flagTag = categoryFolderId
      ? DDBCompendiumFolders.getSourceCategoryFolderName({
        categoryId: categoryFolderKey,
        type: "monster",
      }).flagTag
      : "";
    const folder = this.getFolder(`CR ${paddedCR}`, flagTag)
      ?? (await this.createCompendiumFolder({
        name: `CR ${paddedCR}`,
        color: categoryFolderId ? "" : DDBCompendiumFolders.DDB_COLOR,
        flagTag,
        parentId: categoryFolderId,
      }));
    this.validFolderIds.push(folder._id);
  }

  async createChallengeRatingFolders({ categoryFolderKey = undefined, categoryFolderId = undefined }: IChallengeRatingFolderOptions = {}) {
    for (const cr of CONFIG.DDB.challengeRatings) {
      await this.createChallengeRatingFolder({ categoryFolderKey, categoryFolderId, cr: cr.value });
    }
  }

  static getChallengeRatingFolderNameForTypeSourceCategory(document: I5eMonsterData) {
    const paddedCR = String(document.system.details?.cr ?? "0").padStart(2, "0");

    const result = DDBCompendiumFolders.getSourceCategoryFolderNameFromDocument({
      type: "monster",
      document,
      nameSuffix: `CR ${paddedCR}`,
    });
    return {
      result,
      name: result.name,
      flagTag: result.flagTag,
    };
  }

  async createChallengeRatingFoldersWithSourceCategories() {
    const sourceFoldersData = DDBCompendiumFolders.getAllSourceCategoryFolders("monster");

    for (const data of sourceFoldersData) {
      const sourceFolder = await this._createSourceFolder(data.name, data.flagTag, data.color);

      await this.createChallengeRatingFolders({
        categoryFolderKey: data.categoryId,
        categoryFolderId: sourceFolder._id,
      });
    }
  }

  async createCreatureTypeFoldersWithSourceCategoriesForDocuments(documents: I5eMonsterData[]) {
    for (const doc of documents) {
      const categoryId = foundry.utils.getProperty(doc, "flags.ddbimporter.sourceCategory") ?? 9999999;
      const source = DDBCompendiumFolders.getSourceCategoryFolderName({
        type: "monster",
        categoryId: parseInt(categoryId as string),
      });
      const sourceFolder = await this._createSourceFolder(source.name, source.flagTag, source.color);

      const monsterType = DDBCompendiumFolders.getCreatureDDBType(doc);
      await this.createCreatureTypeFolder({
        categoryFolderKey: source.categoryId,
        categoryFolderId: sourceFolder._id,
        monsterType,
      });
    }
  }

  async createChallengeRatingFoldersWithSourceCategoriesForDocuments(documents: I5eMonsterData[]) {
    for (const doc of documents) {
      const categoryId = foundry.utils.getProperty(doc, "flags.ddbimporter.sourceCategory") ?? 9999999;
      const source = DDBCompendiumFolders.getSourceCategoryFolderName({
        type: "monster",
        categoryId: parseInt(categoryId as string),
      });
      const sourceFolder = await this._createSourceFolder(source.name, source.flagTag, source.color);

      await this.createChallengeRatingFolder({
        categoryFolderKey: source.categoryId,
        categoryFolderId: sourceFolder._id,
        cr: doc.system.details?.cr ?? "0",
      });
    }
  }

  async createMonsterFoldersForDocuments({ documents = [] }: { documents: I5eMonsterData[] }) {
    switch (this.compendiumFolderTypeMonster) {
      case "TYPE": {
        await this.createCreatureTypeFolders();
        return;
      }
      case "ALPHA": {
        await this.createAlphabeticalFolders();
        break;
      }
      case "CR": {
        await this.createChallengeRatingFolders();
        return;
      }
      case "SOURCE_CATEGORY_TYPE":
        await this.createCreatureTypeFoldersWithSourceCategoriesForDocuments(documents);
        break;
      case "SOURCE_CATEGORY_CR":
        await this.createChallengeRatingFoldersWithSourceCategoriesForDocuments(documents);
        break;
      // no default
    }
  }

  async createSpellLevelFolder({ levelName, categoryFolderKey = undefined, categoryFolderId = undefined }: ISpellLevelFolderOptions = {}) {
    if (!levelName) throw new Error("createSpellLevelFolder requires a levelName");
    logger.debug(`Checking for folder '${levelName}'`);
    const flagTag = categoryFolderId
      ? DDBCompendiumFolders.getSourceCategoryFolderName({
        categoryId: categoryFolderKey,
        type: "spell",
      }).flagTag
      : "";
    const folder = this.getFolder(levelName, flagTag)
      ?? (await this.createCompendiumFolder({
        name: levelName,
        flagTag,
        parentId: categoryFolderId,
      }));
    this.validFolderIds.push(folder._id);
  }

  // spell level
  async createSpellLevelFolders({ categoryFolderKey = undefined, categoryFolderId = undefined }: ISpellLevelFolderOptions = {}) {
    for (const levelName of DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL) {
      await this.createSpellLevelFolder({ levelName, categoryFolderKey, categoryFolderId });
    }
  }

  static getSpellFolderNameForTypeSourceCategory(document: I5eSpellItem) {
    const name = DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL[document.system?.level];

    const result = DDBCompendiumFolders.getSourceCategoryFolderNameFromDocument({
      type: "spell",
      document,
      // flagSuffix: document.system?.level,
      nameSuffix: name,
    });
    return {
      result,
      name: result.name,
      flagTag: result.flagTag,
    };
  }

  async createSpellLevelFoldersWithSourceCategories() {
    const sourceFoldersData = DDBCompendiumFolders.getAllSourceCategoryFolders("spell");

    for (const data of sourceFoldersData) {
      const sourceFolder = await this._createSourceFolder(data.name, data.flagTag, data.color);

      await this.createSpellLevelFolders({
        categoryFolderKey: data.categoryId,
        categoryFolderId: sourceFolder._id,
      });
    }
  }

  async createSpellLevelFoldersWithSourceCategoriesForDocuments(documents: I5eSpellItem[]) {
    for (const doc of documents) {
      const folderData = DDBCompendiumFolders.getSpellFolderNameForTypeSourceCategory(doc);
      const categoryFolderData = DDBCompendiumFolders.getSourceCategoryFolderName({
        type: "spell",
        categoryId: folderData.result.categoryId,
      });
      const sourceFolder = await this._createSourceFolder(categoryFolderData.name, categoryFolderData.flagTag, categoryFolderData.color);
      const levelName = DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL[doc.system?.level];
      if (!levelName) return;
      await this.createSpellLevelFolder({
        levelName,
        categoryFolderKey: folderData.result.categoryId,
        categoryFolderId: sourceFolder._id,
      });
    }
  }


  // spell school
  async createSpellSchoolFolders() {
    for (const school of DICTIONARY.spell.schools) {
      const schoolName = utils.capitalize(school.name);
      logger.debug(`Checking for folder '${schoolName}'`);
      const folder = this.getFolder(schoolName)
        ?? (await this.createCompendiumFolder({ name: schoolName }));
      this.validFolderIds.push(folder._id);
    }
  }

  // item rarity folder
  async createItemRarityFolders() {
    for (const rarityName of DICTIONARY.COMPENDIUM_FOLDERS.RARITY) {
      logger.debug(`Checking for folder '${rarityName}'`);
      const folder = this.getFolder(rarityName, rarityName)
        ?? (await this.createCompendiumFolder({ name: rarityName, flagTag: rarityName }));
      this.validFolderIds.push(folder._id);
    }
  }

  async createSpellFoldersForDocuments({ documents = [] }: { documents: I5eSpellItem[] }) {
    switch (this.compendiumFolderTypeSpell) {
      case "SCHOOL":
        await this.createSpellSchoolFolders();
        break;
      case "LEVEL":
        await this.createSpellLevelFolders();
        break;
      case "SOURCE_CATEGORY_LEVEL":
        await this.createSpellLevelFoldersWithSourceCategoriesForDocuments(documents);
        break;
      // no default
    }
  }

  async generateFolderFromData({ sourceKey = "", parentKeyData, parentKey, flagPrefix = "", data }: IGenerateFolderFromDataOptions = {}) {
    if (!data || !parentKeyData) {
      logger.warn("generateFolderFromData called without data or parentKeyData", { data, parentKeyData, parentKey });
      return;
    }
    const sourceKeyFlagPrefix = sourceKey !== "" && !sourceKey.endsWith("/")
      ? `${sourceKey}/`
      : sourceKey;
    const parentKeyFlagPrefix = flagPrefix !== "" && !flagPrefix.endsWith("/")
      ? `${flagPrefix}/`
      : flagPrefix;
    for (const [key, folderData] of Object.entries(data.subFolders ?? {})) {
      const flagTag = `${sourceKeyFlagPrefix}${parentKeyFlagPrefix}${key}/${folderData.folderName}`;
      logger.debug(`Checking for folder '${folderData.folderName}' with key '${key}' with parent key '${parentKey}' and flag tag '${flagTag}'`);

      const folder = this.getFolder(folderData.folderName, flagTag)
        ?? (await this.createCompendiumFolder({
          name: folderData.folderName,
          parentId: parentKeyData.folder?._id,
          color: folderData.color ?? "#222222",
          flagTag,
        }));
      parentKeyData.subFolders[key] = {
        key,
        folder,
        subFolders: {},
      };
      this.validFolderIds.push(folder._id);
    };
  }

  async _createSourceFolder(name: string, flagTag: string, color = "") {
    logger.debug(`Checking for Source Parent folder '${name}'`);
    const existingFolder = this.getFolder(name, flagTag);

    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating Source Parent folder '${name}'`);
    const newFolder = await this.createCompendiumFolder({
      name: name,
      flagTag: flagTag,
      color,
    });
    this.validFolderIds.push(newFolder._id);
    return newFolder;
  }


  async #createSourceFolderFromDocument(document: T5eCompendiumDocuments, type: TCompendiumTypes) {
    const details = DDBCompendiumFolders.getSourceFolderNameFromDocument({ document, type });
    logger.debug(`Checking for Source Parent folder '${details.name}'`, details);
    return this._createSourceFolder(details.name, details.flagTag);
  }

  // async createItemTypeSourceFolderFromDocument(document) {
  //   const sourceFolder = await this.#createSourceFolderFromDocument(document, "item");
  //   let parentFolder = sourceFolder;

  //   const details = DDBCompendiumFolders.getItemFolderNameForTypeSource(document, "item");
  //   if (details.parent) {
  //     const existingFolder = this.getFolder(details.parent.name, details.parent.flagTag);
  //     if (existingFolder) {
  //       parentFolder = existingFolder;
  //     } else {
  //       const newParentFolder = await this.createCompendiumFolder({
  //         name: details.parent.name,
  //         flagTag: details.parent.flagTag,
  //         parentId: sourceFolder._id,
  //       });
  //       parentFolder = newParentFolder;
  //       this.validFolderIds.push(newParentFolder._id);
  //     }
  //   }

  //   logger.debug(`Checking for Item folder '${details.name}'`);
  //   const existingFolder = this.getFolder(details.name, details.flagTag);
  //   if (existingFolder) return existingFolder;
  //   logger.debug(`Not found, creating Item folder '${details.name}'`);
  //   const newFolder = await this.createCompendiumFolder({
  //     name: details.name,
  //     flagTag: details.flagTag,
  //     color: details.parsed.color,
  //     parentId: parentFolder._id,
  //   });
  //   this.validFolderIds.push(newFolder._id);
  //   return newFolder;
  // }

  async createItemTypeCompendiumFolder({
    folderName, type, color, bookCode,
    categoryId, categoryFolderId,
    sourceFolderId,
    createSubFolder = false,
    subFolderName, subKey, flagList, subFolderColor,
  }: IItemTypeFolderOptions = {}) {
    if (!folderName) throw new Error("createItemTypeCompendiumFolder requires a folderName");
    logger.debug(`Checking for root folder '${folderName}' with key '${type}'`);
    const flagTag = categoryFolderId
      ? DDBCompendiumFolders.getSourceCategoryFolderName({
        categoryId,
        type,
      }).flagTag
      : sourceFolderId
        ? DDBCompendiumFolders.getSourceFolderName({
          bookCode,
          type,
        }).flagTag
        : type;
    const folder = this.getFolder(folderName, flagTag)
      ?? (await this.createCompendiumFolder({
        name: folderName,
        flagTag,
        color: color,
        parentId: categoryFolderId ?? sourceFolderId,
      }));
    this.validFolderIds.push(folder._id);

    if (!createSubFolder) return;
    if (!subFolderName) throw new Error("createItemTypeCompendiumFolder requires a subFolderName when creating a sub folder");
    logger.debug(`Checking for ${categoryId}, ${flagTag} sub folder '${subFolderName}' with key '${subKey}'`);

    const subFlagTag = `${flagTag}/${subKey}`;
    if (flagList && !flagList.has(subFlagTag)) return;
    const subFolder = this.getFolder(subFolderName, subFlagTag)
      ?? (await this.createCompendiumFolder({
        name: subFolderName,
        parentId: folder._id,
        color: subFolderColor ?? "#222222",
        flagTag: subFlagTag,
      }));
    this.validFolderIds.push(subFolder._id);
  }

  // item type folder
  async createItemTypeCompendiumFolders({
    categoryFolderKey = undefined, categoryFolderId = undefined,
    sourceFolderKey = undefined, sourceFolderId = undefined, flagList = null,
  }: {
    categoryFolderKey?: number;
    // categoryFolderKey?: string | number;
    categoryFolderId?: string;
    sourceFolderKey?: string;
    sourceFolderId?: string;
    flagList?: Set<string> | null;
  } = {}) {
    const TYPE_FOLDERS: Record<string, ICompendiumFolderTypeDefinition> = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders;
    for (const [key, data] of Object.entries(TYPE_FOLDERS)) {
      const options: IItemTypeFolderOptions = {
        folderName: data.folderName,
        type: key,
        color: data.color,
        bookCode: sourceFolderKey,
        categoryId: categoryFolderKey,
        categoryFolderId,
        sourceFolderId,
        flagList,
      };
      await this.createItemTypeCompendiumFolder(options);

      if (!data.subFolders) continue;
      for (const [subKey, subData] of Object.entries(data.subFolders)) {
        const subFolderData = foundry.utils.deepClone(options);

        subFolderData.createSubFolder = true;
        subFolderData.subFolderName = subData.folderName;
        subFolderData.subKey = subKey;
        subFolderData.subFolderColor = subData.color;
        await this.createItemTypeCompendiumFolder(subFolderData);
      }
    }
  }

  // async createItemTypeFoldersWithSources() {
  //   const index = await this.compendium.getIndex({ fields: this.#getIndexFields() });
  //   // const sources = new Set(index.filter((s) => s.system?.source.book).map((s) => s.system.source.book));

  //   const sources = new Set();
  //   const flagList = new Set();

  //   for (const i of index) {
  //     const d = DDBCompendiumFolders.getItemFolderNameForTypeSource(i, "item");
  //     flagList.add(d.flagTag);
  //     sources.add(d.result.bookCode);
  //   }

  //   const sourceFoldersData = DDBCompendiumFolders.getAllSourceFolders("item")
  //     .filter((f) => sources.has(f.bookCode));

  //   for (const data of sourceFoldersData) {
  //     const sourceFolder = await this._createSourceFolder(data.name, data.flagTag);
  //     await this.createItemTypeCompendiumFolders({
  //       sourceFolderKey: data.bookCode,
  //       sourceFolderId: sourceFolder._id,
  //       flagList,
  //     });
  //   }
  // }

  async createItemTypeFoldersWithSourceCategories(restrict = false) {
    const index = await this.compendium.getIndex({ fields: this.#getIndexFields() });
    // const sources = new Set(index.filter((s) => s.system?.source.book).map((s) => s.system.source.book));

    const sources = new Set();
    const categories = new Set();
    const flagList = new Set<string>();

    if (restrict) {
      for (const i of index) {
        const d = DDBCompendiumFolders.getItemFolderNameForTypeSourceCategory(i as unknown as I5eInventoryItem, "item");
        flagList.add(d.flagTag);
        sources.add(d.result.bookCode);
        categories.add(d.result.categoryId);
      }
    }

    const sourceFoldersData = DDBCompendiumFolders.getAllSourceCategoryFolders("item")
      .filter((f) => !restrict || categories.has(f.categoryId));

    for (const data of sourceFoldersData) {
      const sourceFolder = await this._createSourceFolder(data.name, data.flagTag, data.color);
      await this.createItemTypeCompendiumFolders({
        categoryFolderKey: data.categoryId,
        categoryFolderId: sourceFolder._id,
        flagList: restrict ? flagList : null,
      });
    }
  }

  async createItemTypeFoldersWithSourceCategoriesForDocuments(documents: I5eInventoryItem[]) {
    for (const doc of documents) {
      const folderData = DDBCompendiumFolders.getItemFolderNameForTypeSourceCategory(doc, "item");

      const categoryFolderData = DDBCompendiumFolders.getSourceCategoryFolderName({
        type: "item",
        categoryId: folderData.result.categoryId,
      });

      const sourceFolder = await this._createSourceFolder(categoryFolderData.name, categoryFolderData.flagTag, categoryFolderData.color);

      const data = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders[folderData.parsed.type];

      const options: IItemTypeFolderOptions = {
        folderName: data.folderName,
        type: folderData.parsed.type,
        color: data.color,
        categoryId: folderData.result.categoryId,
        categoryFolderId: sourceFolder._id,
      };
      await this.createItemTypeCompendiumFolder(options);

      if (!data.subFolders) continue;
      if (!folderData.parsed.suffix) continue;

      const subData = data.subFolders[folderData.parsed.suffix];
      if (!subData) continue;
      const subFolderData = foundry.utils.deepClone(options);
      subFolderData.createSubFolder = true;
      subFolderData.subFolderName = subData.folderName;
      subFolderData.subKey = folderData.parsed.suffix;
      subFolderData.subFolderColor = subData.color;
      await this.createItemTypeCompendiumFolder(subFolderData);

    }
  }

  async createSpellFoldersForItemDocuments(documents: I5eInventoryItem[] = []) {
    const rootFolder = this.getFolder("Spell Items", "SpellItems")
      ?? (await this.createCompendiumFolder({ name: "Spell Items", flagTag: "spellitems" }));
    for (const doc of documents.filter((d) => foundry.utils.getProperty(d, "flags.ddbimporter.isSpellItem"))) {
      const spellFolder = DDBCompendiumFolders.getSpellItemFolderNameForType(doc);
      const folder = this.getFolder(spellFolder.name, spellFolder.flagTag)
        ?? (await this.createCompendiumFolder({
          name: spellFolder.name,
          parentId: rootFolder._id,
          color: spellFolder.color ?? "#222222",
          flagTag: spellFolder.flagTag,
        }));
      logger.debug(`Checking for Spell Item folder '${spellFolder.name}' with flag '${spellFolder.flagTag}'`, {
        folder,
        spellFolder,
        document: doc,
      });
    }
  }

  async createItemFoldersForDocuments({ documents = [] }: { documents: I5eInventoryItem[] }) {
    if (documents.filter((d) => foundry.utils.getProperty(d, "flags.ddbImporter.isSpellItem")).length > 0) {
      await this.createSpellFoldersForItemDocuments(documents);
    }
    switch (this.compendiumFolderTypeItem) {
      case "TYPE":
        await this.createItemTypeCompendiumFolders();
        break;
      case "RARITY":
        await this.createItemRarityFolders();
        break;
      case "SOURCE_CATEGORY_TYPE":
        await this.createItemTypeFoldersWithSourceCategoriesForDocuments(documents);
        break;
      // no default
    }
  }

  async createFeatFolder(document: I5eFeatItem) {
    const parentFolder = await this.#createSourceFolderFromDocument(document, "feat");

    const details = DDBCompendiumFolders.getFeatFolderName(document);
    logger.debug(`Checking for Feat folder '${details.name}'`);
    const existingFolder = this.getFolder(details.name, details.flagTag);
    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating Feat folder '${details.name}'`);
    const newFolder = await this.createCompendiumFolder({
      name: details.name,
      flagTag: details.flagTag,
      parentId: parentFolder._id,
    });
    this.validFolderIds.push(newFolder._id);
    return newFolder;
  }

  // tables store their source book code in flags.ddbimporter.sourceBook (RollTable has no system schema)
  static getTableBookFolderName(document: I5eTableData) {
    const bookCode = foundry.utils.getProperty(document, "flags.ddbimporter.sourceBook") as string;
    const legacy = foundry.utils.getProperty(document, "flags.ddbimporter.legacy");
    return DDBCompendiumFolders.getSourceFolderName({
      bookCode,
      isLegacy: Boolean(legacy),
      type: "table",
    });
  }

  getTableFolderName(document: I5eTableData) {
    const book = DDBCompendiumFolders.getTableBookFolderName(document);
    const entityName = foundry.utils.getProperty(document, "flags.ddbimporter.parentName") as string ?? "Unknown";
    return {
      name: entityName,
      flagTag: `${book.flagTag}/${entityName}`,
    };
  }

  async createTableFolder(document: I5eTableData) {
    const book = DDBCompendiumFolders.getTableBookFolderName(document);
    const bookFolder = this.getFolder(book.name, book.flagTag)
      ?? (await this.createCompendiumFolder({
        name: book.name,
        flagTag: book.flagTag,
        color: DDBCompendiumFolders.DDB_COLOR,
      }));
    this.validFolderIds.push(bookFolder._id);

    const details = this.getTableFolderName(document);
    const existingFolder = this.getFolder(details.name, details.flagTag);
    if (existingFolder) {
      this.validFolderIds.push(existingFolder._id);
      return existingFolder;
    }
    const newFolder = await this.createCompendiumFolder({
      name: details.name,
      flagTag: details.flagTag,
      parentId: bookFolder._id,
    });
    this.validFolderIds.push(newFolder._id);
    return newFolder;
  }

  async createFeatureFolder(className: string, name: string, parentId: string, version: string, { tagPrefix = "features", color = "#222222" } = {}) {
    const flagTag = `${version}/${tagPrefix}/${className}/${name}`;
    const folder = this.getFolder(name, flagTag)
      ?? (await this.createCompendiumFolder({ name, parentId, color, flagTag }));
    this.validFolderIds.push(folder._id);
    return folder;
  }

  async createClassFolder(className: string, version = "") {
    const flagTag = `${version}/${className}`;
    const resolvedClassName = DDBCompendiumFolders.resolveVersionedName(className, version);
    const classFolder = this.getFolder(resolvedClassName, flagTag)
      ?? (await this.createCompendiumFolder({ name: resolvedClassName, flagTag }));
    this.classFolders[resolvedClassName] = classFolder._id;
    this.validFolderIds.push(classFolder._id);
    return classFolder;
  }

  async createClassFeatureFolder(className: string, version: string) {
    logger.debug(`Checking for class folder '${className}'`);
    const classFolderId = this.classFolders[className]
      ?? (await this.createClassFolder(className, version))._id;
    const flagTag = `${version}/features/${className}`;
    const classFeaturesFolder = this.getFolder("Class Features", flagTag)
      ?? (await this.createCompendiumFolder({
        name: "Class Features",
        parentId: classFolderId,
        color: "#222222",
        flagTag,
      }));
    this.validFolderIds.push(classFeaturesFolder._id);

    await this.createFeatureFolder(className, "Optional Features", classFolderId, version);

    if (className === "Artificer" && version === "2014") {
      await this.createFeatureFolder(className, "Infusions", classFolderId, version);
    } else if (className === "Sorcerer") {
      await this.createFeatureFolder(className, "Metamagic", classFolderId, version);
    } else if (className === "Warlock") {
      await this.createFeatureFolder(className, "Invocations", classFolderId, version);
      if (version === "2014") await this.createFeatureFolder(className, "Pacts", classFolderId, version);
    }
  }

  async createClassFeaturesHolderFolder(parentClassName: string, parentId: string, version: string) {
    const subClassFlag = `${version}/features/subclass/${parentClassName}`;
    const subClassFolder = this.getFolder("Subclass Features", subClassFlag)
        ?? (await this.createCompendiumFolder({
          name: "Subclass Features",
          parentId,
          color: "#222222",
          flagTag: subClassFlag,
        }));
    const resolvedClassName = DDBCompendiumFolders.resolveVersionedName(parentClassName, version);
    this.subClassFeaturesFolder[resolvedClassName] = subClassFolder._id;
    this.validFolderIds.push(subClassFolder._id);
    return subClassFolder;
  }

  static resolveVersionedName(name: string, version: string) {
    if (!version || version === "") return name;
    if (name.includes(version)) return name;
    if (version === "2024") return name;
    return `${name} (${version})`;
  }

  async createSubClassFeatureFolder(subclassName: string, parentClassName: string, version: string) {
    logger.debug(`Checking for Subclass folder '${subclassName}' with Parent Class '${parentClassName}' (${version})`);

    const resolvedClassName = DDBCompendiumFolders.resolveVersionedName(parentClassName, version);
    const classFolderId = this.classFolders[resolvedClassName]
     ?? (await this.createClassFolder(parentClassName, version))._id;
    await this.createClassFeatureFolder(parentClassName, version);
    const subClassFolderId = this.subClassFeaturesFolder[resolvedClassName]
      ?? (await this.createClassFeaturesHolderFolder(parentClassName, classFolderId, version))._id;

    // create actual folder
    const flagTag = `${version}/features/${subclassName}`;
    const folder = this.getFolder(subclassName, flagTag)
      ?? (await this.createCompendiumFolder({
        name: `${subclassName}`,
        parentId: subClassFolderId,
        color: "#222222",
        flagTag,
      }));
    this.validFolderIds.push(folder._id);

    if (parentClassName === "Fighter" && subclassName === "Battle Master") {
      await this.createFeatureFolder(subclassName, "Maneuver Options", classFolderId, version);
    } else if (parentClassName === "Fighter" && subclassName === "Rune Knight") {
      await this.createFeatureFolder(subclassName, "Runes", classFolderId, version);
    } else if (parentClassName === "Artificer" && subclassName === "Alchemist") {
      await this.createFeatureFolder(subclassName, "Experimental Elixirs", classFolderId, version);
    }
  }

  async createSubTraitFolders(doc: I5eRaceItem | I5eFeatItem) {
    const details = this.getRaceFolderName(doc);
    const categoryFolderData = DDBCompendiumFolders.getSourceCategoryFolderName({
      type: "trait",
      categoryId: details.categoryId,
    });
    const sourceFolder = await this._createSourceFolder(categoryFolderData.name, categoryFolderData.flagTag, categoryFolderData.color);

    logger.debug(`Checking for Species folder for '${doc.name}'`);

    const speciesBaseFolder = this.getFolder(details.name, details.flagTag)
      ?? (await this.createCompendiumFolder({
        name: details.name,
        parentId: sourceFolder._id,
        color: "#222222",
        flagTag: details.flagTag,
      }));
    this.validFolderIds.push(speciesBaseFolder._id);

    const traitDetails = this.getRaceTraitFolderName(doc);

    const folder = this.getFolder(traitDetails.name, traitDetails.flagTag)
      ?? (await this.createCompendiumFolder({
        name: traitDetails.name,
        parentId: speciesBaseFolder._id,
        color: "#222222",
        flagTag: traitDetails.flagTag,
      }));
    this.validFolderIds.push(folder._id);
  }

  async createSummonsFolder(document: I5eMonsterData) {
    const data = this.getSummonFolderName(document);
    logger.debug(`Checking for Summons folder '${data.name}'`);
    const existingFolder = this.getFolder(data.name, data.flagTag);
    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating summons folder '${data.name}'`);
    const newFolder = await this.createCompendiumFolder({
      name: data.name,
      flagTag: data.flagTag,
    });
    this.validFolderIds.push(newFolder._id);
    return newFolder;
  }

  async createBackgroundFolder(document: I5eBackgroundItem) {
    const details = DDBCompendiumFolders.getBackgroundFolderName(document);
    if (this.backgroundFolders[details.name]) return this.backgroundFolders[details.name];
    logger.debug(`Checking for Background folder '${details.name}'`);
    const existingFolder = this.getFolder(details.name, details.flagTag);
    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating backgrounds folder '${details.name}'`);
    const newFolder = await this.createCompendiumFolder({
      name: details.name,
      flagTag: details.flagTag,
    });
    this.validFolderIds.push(newFolder._id);
    this.backgroundFolders[details.name] = newFolder;
    return newFolder;
  }

  async createVehicleFolder(document: I5eVehicleData) {
    const details = DDBCompendiumFolders.getVehicleFolderName(document);
    if (this.vehicleFolders[details.name]) return this.vehicleFolders[details.name];
    logger.debug(`Checking for Vehicle folder '${details.name}'`);
    const existingFolder = this.getFolder(details.name, details.flagTag);
    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating vehicles folder '${details.name}'`);
    const newFolder = await this.createCompendiumFolder({
      name: details.name,
      flagTag: details.flagTag,
    });
    this.validFolderIds.push(newFolder._id);
    this.vehicleFolders[details.name] = newFolder;
    return newFolder;
  }

  async createVehicleFoldersForDocuments({ documents = [] }: { documents: I5eVehicleData[] }) {
    for (const doc of documents) {
      await this.createVehicleFolder(doc);
    }
  }

  // async createSummonsSubFolder(type, subFolderName) {
  //   const flagTag = `summons/${type}/${subFolderName}`;
  //   logger.debug(`Checking for Summons folder '${subFolderName}' with Base Folder '${subFolderName}'`);

  //   const parentFolder = await this.createSummonsFolder(type);

  //   const folder = this.getFolder(subFolderName, flagTag)
  //     ?? (await this.createCompendiumFolder({
  //       name: subFolderName,
  //       parentId: parentFolder._id,
  //       color: "#222222",
  //       flagTag,
  //     }));
  //   this.validFolderIds.push(folder._id);
  // }


  async createCompendiumFolders() {
    logger.debug(`Checking and creating Compendium folder structure for ${this.type}`);

    this.resetFolderLookups();

    switch (this.type) {
      case "monsters":
      case "npc":
      case "monster": {
        switch (this.compendiumFolderTypeMonster) {
          case "TYPE": {
            await this.createCreatureTypeFolders();
            break;
          }
          case "ALPHA": {
            await this.createAlphabeticalFolders();
            break;
          }
          case "CR": {
            await this.createChallengeRatingFolders();
            break;
          }
          case "SOURCE_CATEGORY_TYPE":
            await this.createCreatureTypeFoldersWithSourceCategories();
            break;
          case "SOURCE_CATEGORY_CR":
            await this.createChallengeRatingFoldersWithSourceCategories();
            break;
          // no default
        }
        break;
      }
      case "spell":
      case "spells": {
        switch (this.compendiumFolderTypeSpell) {
          case "SCHOOL":
            await this.createSpellSchoolFolders();
            break;
          case "LEVEL":
            await this.createSpellLevelFolders();
            break;
          case "SOURCE_CATEGORY_LEVEL":
            await this.createSpellLevelFoldersWithSourceCategories();
            break;
          // no default
        }
        break;
      }
      case "inventory":
      case "item":
      case "items": {
        switch (this.compendiumFolderTypeItem) {
          case "TYPE":
            await this.createItemTypeCompendiumFolders();
            break;
          case "RARITY":
            await this.createItemRarityFolders();
            break;
          case "SOURCE_CATEGORY_TYPE":
            await this.createItemTypeFoldersWithSourceCategories();
            break;
          // no default
        }
        break;
      }
      // others are created as needed
      // no default
    }
    return this.compendium.folders;
  }

  static getItemFolderNameForRarity(document: I5eInventoryItem, useSource = false) {
    let name;
    const rarity = document.system.rarity;

    if (rarity) {
      switch (rarity.toLowerCase().trim()) {
        case "common":
          name = "Common";
          break;
        case "uncommon":
          name = "Uncommon";
          break;
        case "rare":
          name = "Rare";
          break;
        case "very rare":
        case "veryrare":
          name = "Very Rare";
          break;
        case "legendary":
          name = "Legendary";
          break;
        case "artifact":
          name = "Artifact";
          break;
        case "varies":
          name = "Varies";
          break;
        case "unknown":
        case "":
        default:
          name = "Unknown";
          break;
      }
    } else {
      name = "Unknown";
    }

    if (useSource) {
      const result = DDBCompendiumFolders.getSourceFolderNameFromDocument({
        type: "spell",
        document,
        flagSuffix: utils.idString(name).toLowerCase(),
        nameSuffix: name,
      });
      return result;
    }
    return { name, flagTag: name };
  }


  static getItemFolderNameForType(document: I5eInventoryItem) {
    const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
    const ddbTypeId = utils.idString(ddbType ?? "").toLowerCase();
    const typeFolderRoot = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders[document.type]
      ?? (ddbType
        ? DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders[ddbTypeId]
        : null);

    const systemType = foundry.utils.getProperty(document, "system.type.value") as string | undefined;

    let subTypeFolder = null;

    const parsed = {
      name: typeFolderRoot?.folderName
        ?? "Unknown",
      type: (document.type as string) || "tattoo",
      suffix: null as string | null,
      // suffix: null as string | number | null,
      color: typeFolderRoot?.color ?? null,
      parentFolderName: typeFolderRoot?.folderName
        ?? "Unknown",
      subType: false,
      ddbType,
      ddbTypeId,
      systemType,
    };

    if (typeFolderRoot?.subFolders?.[ddbTypeId]) {
      subTypeFolder = typeFolderRoot.subFolders[ddbTypeId];
      parsed.suffix = ddbTypeId;
    } else if (systemType && typeFolderRoot?.subFolders?.[systemType]) {
      subTypeFolder = typeFolderRoot.subFolders[systemType];
      parsed.suffix = systemType;
    }

    if (ddbTypeId === "tattoo") {
      parsed.type = "tattoo";
      parsed.suffix = null;
    }

    if (subTypeFolder) {
      parsed.subType = true;
      if (subTypeFolder.color) parsed.color = subTypeFolder.color;
      parsed.name = subTypeFolder.folderName;
    }

    if (document.type === "equipment" && systemType === "trinket") {
      const isContainer = foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.isContainer") === true;
      const containerFolder = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders["container"];
      const containerSubFolder = containerFolder?.subFolders?.[ddbTypeId];
      if (isContainer && containerSubFolder) {
        parsed.name = containerSubFolder.folderName;
        // parsed.suffix = utils.idString(parsed.name).toLowerCase();
        parsed.suffix = ddbTypeId;
        parsed.type = "container";
        parsed.parentFolderName = containerFolder.folderName;
      }
    } else if (document.type === "tool") {
      const instrument = document.flags?.ddbimporter?.dndbeyond?.tags?.includes("Instrument");
      const ddbTypes = systemType !== undefined && ["art", "music", "game"].includes(systemType);
      if (instrument) {
        const musicFolder = typeFolderRoot?.subFolders?.["music"];
        if (musicFolder) {
          parsed.name = musicFolder.folderName;
          parsed.suffix = "music";
        }
      } else if (ddbTypes && systemType) {
        const systemTypeFolder = typeFolderRoot?.subFolders?.[systemType];
        if (systemTypeFolder) {
          parsed.name = systemTypeFolder.folderName;
          parsed.suffix = systemType;
        }
      }
    } else if (document.type === "consumable") {
      if (document.system.type?.value === "ammo") {
        parsed.suffix = "ammunition";
      }
    }

    return {
      name: parsed.name,
      flagTag: parsed.suffix ? `${parsed.type}/${parsed.suffix}` : parsed.type,
      parsed,
      typeFolderRoot,
      subTypeFolder,
    };

  }

  static getItemFolderNameForTypeSourceCategory(document: I5eInventoryItem, sourceType = null as string | null) {
    const folderData = DDBCompendiumFolders.getItemFolderNameForType(document);

    const parent = folderData.subTypeFolder
      ? DDBCompendiumFolders.getSourceCategoryFolderNameFromDocument({
        type: sourceType ?? folderData.parsed.type,
        document,
        nameSuffix: folderData.parsed.parentFolderName,
      })
      : null;

    const result = DDBCompendiumFolders.getSourceCategoryFolderNameFromDocument({
      type: folderData.parsed.type,
      document,
      flagSuffix: folderData.parsed.suffix,
      nameSuffix: folderData.parsed.name,
    });
    return {
      parent,
      folderData,
      parsed: folderData.parsed,
      result,
      name: result.name,
      flagTag: result.flagTag,
    };
  }

  static getSpellItemFolderNameForType(document: I5eInventoryItem) {
    // Implement the logic to get the folder name for spell items
    let spellName: string = foundry.utils.getProperty(document, "flags.ddbimporter.spellName") as string ?? "Unknown";
    const is2014 = foundry.utils.getProperty(document, "flags.ddbimporter.is2014");
    if (utils.getSetting<string>("rulesVersion", "dnd5e") === "modern" && is2014) {
      spellName = `${spellName} (2014)`;
    } else if (utils.getSetting<string>("rulesVersion", "dnd5e") !== "modern" && !is2014) {
      spellName = `${spellName} (2024)`;
    }
    return {
      name: spellName,
      type: "spell",
      suffix: null as string | number | null,
      color: null as string | null,
      parentFolderName: "Spell Items",
      flagTag: `spellitem/${is2014 ? "2014" : "2024"}/${utils.idString(spellName)}`,
    };
  }

  getItemCompendiumFolderName(document: I5eInventoryItem) {
    let name;
    const isSpellItem = foundry.utils.getProperty(document, "flags.ddbimporter.isSpellItem");

    if (isSpellItem) {
      name = DDBCompendiumFolders.getSpellItemFolderNameForType(document);
      return name;
    }
    switch (this.compendiumFolderTypeItem) {
      case "RARITY": {
        name = DDBCompendiumFolders.getItemFolderNameForRarity(document);
        break;
      }
      case "RARITY_SOURCE": {
        name = DDBCompendiumFolders.getItemFolderNameForRarity(document, true);
        break;
      }
      case "TYPE": {
        name = DDBCompendiumFolders.getItemFolderNameForType(document);
        break;
      }
      case "SOURCE_CATEGORY_TYPE": {
        name = DDBCompendiumFolders.getItemFolderNameForTypeSourceCategory(document, "item");
        break;
      }
      // no default
    }
    return name;
  }


  getClassFeatureFolderName(document: I5eFeatItem) {
    const result = {
      name: undefined as string | undefined,
      flagTag: "",
    };
    const version = foundry.utils.getProperty(document, "system.source.rules");
    const subClassName = (foundry.utils.getProperty(document, "flags.ddbimporter.subClass") as string)?.replace("(2014)", "").trim();
    const className = foundry.utils.getProperty(document, "flags.ddbimporter.class") as string;
    const optional = foundry.utils.getProperty(document, "flags.ddbimporter.optionalFeature");
    const infusion = foundry.utils.getProperty(document, "flags.ddbimporter.infusionFeature");
    const elixir = foundry.utils.getProperty(document, "flags.ddbimporter.experimentalElixir");
    const subType = foundry.utils.getProperty(document, "system.type.subtype");

    const validSubclass = subClassName && subClassName.trim() !== "";
    const validClass = className && className.trim() !== "";

    if (infusion) {
      result.name = "Infusions";
      result.flagTag = `${version}/features/${className}/Infusions`;
    } else if (optional) {
      result.name = "Optional Features";
      result.flagTag = `${version}/features/${className}/Optional Features`;
    // specialist folders
    } else if (elixir) {
      result.name = "Experimental Elixirs";
      result.flagTag = `${version}/features/${subClassName}/Experimental Elixirs`;
    } else if (subType === "metamagic" && className === "Sorcerer") {
      result.name = "Metamagic";
      result.flagTag = `${version}/features/${className}/Metamagic`;
    } else if (subType === "pact" && className === "Warlock") {
      result.name = "Pacts";
      result.flagTag = `${version}/features/${className}/Pacts`;
    } else if (subType === "eldritchInvocation" && className === "Warlock") {
      result.name = "Invocations";
      result.flagTag = `${version}/features/${className}/Invocations`;
    } else if (subType === "maneuver" && className === "Fighter") {
      result.name = "Maneuver Options";
      result.flagTag = `${version}/features/${subClassName}/Maneuver Options`;
    } else if (subType === "rune" && className === "Fighter") {
      result.name = "Runes";
      result.flagTag = `${version}/features/${subClassName}/Runes`;
    } else if (validSubclass) {
      result.name = subClassName;
      result.flagTag = `${version}/features/${subClassName}`;
    } else if (validClass) {
      result.name = "Class Features";
      result.flagTag = `${version}/features/${className}`;
    } else {
      result.name = "Unknown";
    }

    // console.warn(`Folder Name for ${document.name}`, {
    //   result,
    //   subClassName,
    //   className,
    //   optional,
    //   infusion,
    //   subType,
    //   validSubclass,
    //   validClass,
    //   document,
    // });

    if (result.name) return result;
    else return undefined;
  }


  getRaceTraitFolderName(document: I5eRaceItem | I5eFeatItem) {
    // "flags.ddbimporter.baseRaceName",
    // "flags.ddbimporter.baseName",
    // "flags.ddbimporter.subRaceShortName",
    // "flags.ddbimporter.isSubRace",
    // const isSubRace = foundry.utils.getProperty(document, "flags.ddbimporter.isSubRace");
    // const baseRaceName = foundry.utils.getProperty(document, "flags.ddbimporter.baseRaceName");
    // const baseName = foundry.utils.getProperty(document, "flags.ddbimporter.baseName");
    // const subRaceShortName = foundry.utils.getProperty(document, "flags.ddbimporter.subRaceShortName");
    const fullRaceName = foundry.utils.getProperty(document, "flags.ddbimporter.fullRaceName") as string;
    const groupName = foundry.utils.getProperty(document, "flags.ddbimporter.groupName") as string;
    const isLineage = foundry.utils.getProperty(document, "flags.ddbimporter.isLineage");

    const source = (foundry.utils.getProperty(document, "system.source.book") as string) ?? "Unknown";
    const ddbCode = DDBSources.getDDBSourceBook(source);
    const bookData = CONFIG.DDB.sources.find((b) => b.name === ddbCode);
    const resolvedCategoryId = bookData?.sourceCategoryId ?? undefined;

    const nameSuffix = fullRaceName === groupName
      || isLineage
      || (resolvedCategoryId !== undefined && [26, 24, 35].includes(resolvedCategoryId))
      ? "Traits"
      : `${fullRaceName} Traits`;

    const flagStr = `${groupName ?? fullRaceName}/${nameSuffix}`;
    const flagName = utils.idString(flagStr).toLowerCase();

    return DDBCompendiumFolders.getSourceCategoryFolderNameFromDocument({
      type: "trait",
      document,
      flagSuffix: flagName,
      nameSuffix,
    });
  }


  getRaceFolderName(document: I5eRaceItem | I5eFeatItem) {
    const fullRaceName = foundry.utils.getProperty(document, "flags.ddbimporter.fullRaceName") as string;
    const groupName = foundry.utils.getProperty(document, "flags.ddbimporter.groupName") as string;
    const nameSuffix = groupName ?? fullRaceName;

    return DDBCompendiumFolders.getSourceCategoryFolderNameFromDocument({
      type: "species",
      document,
      flagSuffix: utils.idString(nameSuffix).toLowerCase(),
      nameSuffix,
    });
  }


  getSummonFolderName(document: I5eMonsterData) {
    // name is always assigned below
    const result = {
      name: "",
      flagTag: "",
    };

    const folderHint = foundry.utils.getProperty(document, "flags.ddbimporter.summons.folder");
    const summonHint = foundry.utils.getProperty(document, "flags.ddbimporter.summons.name");
    const rules = foundry.utils.getProperty(document, "system.source.rules");
    const prefix = folderHint ?? summonHint ?? document.name;
    const suffix = rules ? ` (${rules})` : "";
    result.name = `${prefix}${suffix}`;
    result.flagTag = `summon/${rules ?? "unknown"}/${result.name}`;

    return result;
  }


  getClassFolderName(document: I5eClassItem) {
    const result = {
      name: undefined as string | undefined,
      flagTag: "",
    };
    const className = foundry.utils.getProperty(document, "flags.ddbimporter.class") as string;
    const version = foundry.utils.getProperty(document, "system.source.rules") as string;
    if (className && className.trim() !== "") {
      const resolvedClassName = DDBCompendiumFolders.resolveVersionedName(className, version);
      result.name = resolvedClassName;
      result.flagTag = `${version}/${className}`;
    } else {
      result.name = "Unknown";
    }

    if (result.name) return result;
    else return undefined;
  }

  static getSourceCategoryFolderName({
    categoryId, bookCode, isLegacy = false, type, noSourceNameOverride = null, nameSuffix = "", flagSuffix = "",
  }: ISourceCategoryFolderNameOptions = {}) {
    // name is always assigned by one of the branches below
    const result = {
      name: "Unknown",
      flagTag: "",
      parent: false,
      bookCode,
      categoryId,
      categoryName: null as string | null,
      color: "",
    };

    const suffix = flagSuffix && String(flagSuffix).trim() !== ""
      ? `/${flagSuffix}`
      : "";

    let resolvedCategoryId = categoryId;

    if (categoryId === undefined && bookCode) {
      const ddbCode = DDBSources.getDDBSourceBook(bookCode);
      const bookData = CONFIG.DDB.sources.find((b) => b.name === ddbCode);
      if (bookData) {
        resolvedCategoryId = bookData.sourceCategoryId;
      }
    }

    const categoryData = CONFIG.DDB.sourceCategories.find((c) => c.id === resolvedCategoryId);

    if (categoryData?.name) {
      result.color = DICTIONARY.COMPENDIUM_FOLDERS.SOURCE_CATEGORY_FOLDERS[categoryData.id]?.color ?? "";
      result.name = nameSuffix === "" ? categoryData.name : nameSuffix;
      result.flagTag = `${type}/${resolvedCategoryId}${suffix}`;
      result.parent = true;
      result.categoryName = categoryData.name;
    } else {
      const name = noSourceNameOverride ?? (isLegacy ? "Legacy" : "Unknown");
      result.name = name;
      result.flagTag = `${type}/${name}`;
    }

    result.categoryId = resolvedCategoryId;

    return result;
  }


  static getSourceCategoryFolderNameFromDocument({
    document, type, noSourceNameOverride = null, nameSuffix = "", flagSuffix = "",
  }: ISourceFolderNameFromDocumentOptions = {}) {
    const source = foundry.utils.getProperty(document ?? {}, "system.source.book") as string ?? "Unknown";
    const legacy = foundry.utils.getProperty(document ?? {}, "flags.ddbimporter.legacy") as boolean;

    return DDBCompendiumFolders.getSourceCategoryFolderName({
      bookCode: source,
      isLegacy: legacy,
      type,
      noSourceNameOverride,
      nameSuffix,
      flagSuffix,
    });
  }

  static getSourceFolderName({ bookCode, isLegacy = false, type, noSourceNameOverride = null, nameSuffix = "", flagSuffix = "" }: ISourceFolderNameOptions = {}) {
    // name is always assigned by one of the branches below
    const result = {
      name: "Unknown",
      flagTag: "",
      parent: false,
      bookCode,
    };

    const suffix = flagSuffix && String(flagSuffix).trim() !== ""
      ? `/${flagSuffix}`
      : "";

    const sourceName = bookCode && bookCode.trim() !== ""
      ? CONFIG.DND5E.sourceBooks[bookCode]
      : null;

    if (sourceName) {
      result.name = nameSuffix === "" ? sourceName : nameSuffix;
      result.flagTag = `${type}/${bookCode}${suffix}`;
      result.parent = true;
    } else {
      const name = noSourceNameOverride ?? (isLegacy ? "Legacy" : "Unknown");
      result.name = name;
      result.flagTag = `${type}/${name}`;
    }

    return result;
  }


  static getSourceFolderNameFromDocument({
    document, type, noSourceNameOverride = null, nameSuffix = "", flagSuffix = "",
  }: ISourceFolderNameFromDocumentOptions = {}) {
    const source = foundry.utils.getProperty(document ?? {}, "system.source.book") as string;
    const legacy = foundry.utils.getProperty(document ?? {}, "flags.ddbimporter.legacy") as boolean;

    return DDBCompendiumFolders.getSourceFolderName({
      bookCode: source,
      isLegacy: legacy,
      type,
      noSourceNameOverride,
      nameSuffix,
      flagSuffix,
    });
  }

  static getAllSourceFolders(type: string) {
    const results: Record<string, any>[] = [];
    for (const key of Object.keys(CONFIG.DND5E.sourceBooks)) {
      results.push(DDBCompendiumFolders.getSourceFolderName({
        type,
        bookCode: key,
      }));
    }
    return results;
  }

  static getAllSourceCategoryFolders(type: string) {
    const results: Record<string, any>[] = [];
    for (const data of DDBSources.getDisplaySourceCategories(true)) {
      results.push(DDBCompendiumFolders.getSourceCategoryFolderName({
        type,
        categoryId: data.id,
      }));
    }
    return results;
  }

  static getFeatFolderName(document: I5eFeatItem) {
    const type = foundry.utils.getProperty(document, "system.type.subtype") as string;
    const typeName = CONFIG.DND5E.featureTypes.feat.subtypes[type];

    const folderName = typeName ? `${typeName.replace(" Feat", "")}` : null;

    return DDBCompendiumFolders.getSourceFolderNameFromDocument({
      type: "feat",
      document,
      suffix: folderName ?? "General",
      nameSuffix: folderName ?? "General",
      noSourceNameOverride: "General",
    });
  }

  static getBackgroundFolderName(document: I5eBackgroundItem) {
    return DDBCompendiumFolders.getSourceFolderNameFromDocument({ document, type: "background" });
  }

  static getVehicleFolderName(document: I5eVehicleData) {
    return DDBCompendiumFolders.getSourceFolderNameFromDocument({ document, type: "vehicle" });
  }


  getCompendiumFolderData(document: T5eCompendiumDocuments) {
    let data: any;
    switch (this.type) {
      case "background":
      case "backgrounds": {
        data = DDBCompendiumFolders.getBackgroundFolderName(document as I5eBackgroundItem);
        break;
      }
      case "feat":
      case "feats": {
        data = DDBCompendiumFolders.getFeatFolderName(document as I5eFeatItem);
        break;
      }
      case "trait":
      case "traits": {
        data = this.getRaceTraitFolderName(document as I5eFeatItem);
        break;
      }
      case "species":
      case "race":
      case "races": {
        data = this.getRaceFolderName(document as I5eRaceItem);
        break;
      }
      case "feature":
      case "features": {
        data = this.getClassFeatureFolderName(document as I5eFeatItem);
        break;
      }
      case "class":
      case "classes":
      case "subclass":
      case "subclasses": {
        data = this.getClassFolderName(document as I5eClassItem);
        break;
      }
      case "summon":
      case "summons": {
        data = this.getSummonFolderName(document as I5eMonsterData);
        break;
      }
      case "monsters":
      case "npc":
      case "monster": {
        const monster = document as I5eMonsterData;
        switch (this.compendiumFolderTypeMonster) {
          case "TYPE": {
            const creatureType = monster.system?.details?.type?.value
              ? monster.system?.details?.type?.value
              : "Unknown";
            const ddbType = CONFIG.DDB.monsterTypes.find((c) => creatureType.toLowerCase() == c.name.toLowerCase());
            if (ddbType) data = {
              name: ddbType.name,
              flagTag: "",
            };
            break;
          }
          case "SOURCE_CATEGORY_TYPE": {
            data = DDBCompendiumFolders.getCreatureTypeFolderNameForTypeSourceCategory(monster);
            break;
          }
          case "ALPHA": {
            data = monster.name
              .replace(/[^a-z]/gi, "")
              .charAt(0)
              .toUpperCase();
            break;
          }
          case "CR": {
            const cr = monster.system.details?.cr;
            if (cr !== undefined) {
              const paddedCR = String(cr).padStart(2, "0");
              data = {
                name: `CR ${paddedCR}`,
                flagTag: "",
              };
            }
            break;
          }
          case "SOURCE_CATEGORY_CR": {
            data = DDBCompendiumFolders.getChallengeRatingFolderNameForTypeSourceCategory(monster);
            break;
          }
          // no default
        }
        break;
      }
      case "spell":
      case "spells": {
        const spell = document as I5eSpellItem;
        switch (this.compendiumFolderTypeSpell) {
          case "SCHOOL": {
            const school = spell.system?.school;
            const schoolData = school ? DICTIONARY.spell.schools.find((sch) => school == sch.id) : undefined;
            if (schoolData) {
              data = utils.capitalize(schoolData.name);
            }
            break;
          }
          case "LEVEL": {
            const levelFolder = DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL[spell.system?.level];
            data = {
              name: levelFolder,
              flagTag: null,
            };
            break;
          }
          case "SOURCE_CATEGORY_LEVEL": {
            data = DDBCompendiumFolders.getSpellFolderNameForTypeSourceCategory(spell);
            break;
          }
          // no default
        }
        break;
      }
      case "inventory":
      case "item":
      case "items": {
        try {
          data = this.getItemCompendiumFolderName(document as I5eInventoryItem);
        } catch (e) {
          logger.error("Error in getItemCompendiumFolderName", { error: e, document });
          throw e;
        }
        break;
      }
      case "vehicle":
      case "vehicles": {
        data = DDBCompendiumFolders.getVehicleFolderName(document as I5eVehicleData);
        break;
      }
      case "table":
      case "tables":
      case "RollTable": {
        data = this.getTableFolderName(document as I5eTableData);
        break;
      }
      // no default
    }
    return data;
  }

  getFolder(folderName: string, flagTag = "") {
    const folder = this.compendium.folders.find((f) =>
      f.name === folderName
      && (f.flags as { ddbimporter?: { flagTag?: string } })?.ddbimporter?.flagTag === flagTag,
    );
    return folder;
  }

  getFolderId(document: T5eCompendiumDocuments) {
    const folderName = this.getCompendiumFolderData(document);
    if (folderName) {
      const folder = this.getFolder((folderName.name ?? folderName), (folderName.flagTag ?? ""));
      if (folder) return folder._id;
    }
    return undefined;
  }

  // async addToCompendiumFolder(document: TImporterItem) {
  //   logger.debug(`Checking ${document.name} in ${this.packName}`);

  //   const folderName = this.getCompendiumFolderData(document);
  //   if (folderName) {
  //     const folder = this.compendium.folders.find((f) => f.name == (folderName.name ?? folderName));
  //     if (folder) {
  //       logger.info(`Moving ${this.type} ${document.name} to folder ${folder.name}`);
  //       await document.update({ folder: folder._id } as any);
  //     } else {
  //       logger.error(`Unable to find folder "${folderName}" in "${this.packName}" for ${this.type}`);
  //     }
  //   }
  // }


  #getIndexFields() {
    switch (this.type) {
      case "spells":
      case "spell": {
        return [
          "name",
          "system.level",
          "system.school",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "flags.ddbimporter.is2014",
        ];
      }
      case "inventory":
      case "items":
      case "item": {
        return [
          "name",
          "type",
          "flags.ddbimporter.dndbeyond.type",
          "flags.ddbimporter.dndbeyond.tags",
          "flags.ddbimporter.is2014",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "system.armor.type",
          "system.type.value",
          "system.rarity",
          "system.type.value",
          "system.details.type.value",
          "system.type.subtype",
        ];
      }
      case "monster":
      case "monsters": {
        return [
          "name",
          "type",
          "system.details.type.value",
          "system.details.cr",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "flags.ddbimporter.is2014",
        ];
      }
      case "summon":
      case "summons": {
        return [
          "name",
          "type",
          "flags.ddbimporter.summons.name",
          "flags.ddbimporter.summons.folder",
          "system.source.book",
          "system.source.rules",
          "flags.ddbimporter.legacy",
          "flags.ddbimporter.is2014",
        ];
      }
      case "class":
      case "subclass":
      case "classes":
      case "subclasses":
      case "features":
      case "feature": {
        return [
          "name",
          "flags.ddbimporter.class",
          "flags.ddbimporter.subClass",
          "flags.ddbimporter.optionalFeature",
          "flags.ddbimporter.infusionFeature",
          "flags.ddbimporter.experimentalElixir",
          "flags.ddbimporter.is2014",
          "system.type.subtype",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "system.source.rules",
        ];
      }
      case "feat":
      case "feats": {
        return [
          "name",
          "system.type.subtype",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "flags.ddbimporter.is2014",
        ];
      }
      case "trait":
      case "traits":
      case "species":
      case "race":
      case "races": {
        return [
          "name",
          "flags.ddbimporter.baseRaceName",
          "flags.ddbimporter.baseName",
          "flags.ddbimporter.subRaceShortName",
          "flags.ddbimporter.isSubRace",
          "flags.ddbimporter.fullRaceName",
          "flags.ddbimporter.groupName",
          "flags.ddbimporter.isLineage",
          "flags.ddbimporter.is2014",
          "flags.ddbimporter.entityRaceId",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "system.source.rules",
        ];
      }
      case "vehicle":
      case "vehicles":
      case "background":
      case "backgrounds": {
        return [
          "name",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "flags.ddbimporter.is2014",
        ];
      }
      case "table":
      case "tables":
      case "RollTable": {
        return [
          "name",
          "flags.ddbimporter.parentName",
          "flags.ddbimporter.sourceBook",
          "flags.ddbimporter.legacy",
        ];
      }
      default:
        return [
          "name",
          "system.type.subtype",
          "system.source.book",
          "flags.ddbimporter.legacy",
          "flags.ddbimporter.is2014",
        ];
    }
  }


  async _migrateExistingCompendium({ deleteExisting = true, cleanup = true } = {}) {
    if (!this.compendium) {
      this.loadCompendium(this.type, true);
    }

    if (deleteExisting) {
      const foldersToRemove = this.compendium.folders.filter((f) => !this.validFolderIds.includes(f._id)).map((f) => f._id);
      logger.debug("Deleting folders", foldersToRemove);
      const chunkSize = 20;
      for (let i = 0; i < foldersToRemove.length; i += chunkSize) {
        const chunk = foldersToRemove.slice(i, i + chunkSize);
        logger.debug("Deleting chunk folders", chunk);
        await Folder.deleteDocuments(chunk, { pack: this.packName });
      }
    }

    logger.debug("Remaining Compendium Folders", this.compendium.folders);

    const index = await this.compendium.getIndex({ fields: this.#getIndexFields() });

    await this.createCompendiumFolders();

    const results: { _id: string; folder: string }[] = [];
    for (const i of index) {
      // index entries carry the fields getCompendiumFolderData reads, fvtt-types cannot express this
      const folderId = this.getFolderId(i as unknown as T5eCompendiumDocuments);
      if (folderId) {
        results.push({
          _id: i._id,
          folder: folderId,
        });
      }
    }

    logger.debug("Folder update results", results);

    switch (this.type) {
      case "summon":
      case "summons":
      case "monsters":
      case "vehicle":
      case "vehicles":
      case "npc":
      case "monster": {
        const chunkSize = 250;
        for (let i = 0; i < results.length; i += chunkSize) {
          const chunk = results.slice(i, i + chunkSize);
          logger.debug("Updating chunk actors", chunk);
          await Actor.updateDocuments(chunk as unknown as Actor.UpdateData[], { pack: this.packName });
        }
        break;
      }
      default: {
        const chunkSize = 250;
        for (let i = 0; i < results.length; i += chunkSize) {
          const chunk = results.slice(i, i + chunkSize);
          logger.debug("Updating chunk items", chunk);
          await Item.updateDocuments(chunk as unknown as Item.UpdateInput[], { pack: this.packName });
        }
        break;
      }
    }

    if (cleanup) await this.removeUnusedFolders();

    return this.compendium.folders;
  }

  static async migrateExistingCompendium(type: TCompendiumTypes, { folderStructure = null as string | null, cleanup = true, deleteExisting = true } = {}) {
    if (folderStructure) {
      await utils.setSetting(`munching-selection-compendium-folders-${type.replace(/s+$/, "")}`, folderStructure as string);
    }
    const compendiumFolders = new DDBCompendiumFolders(type);
    await compendiumFolders.loadCompendium(type, true);
    await compendiumFolders._migrateExistingCompendium({ deleteExisting, cleanup });
  }

  // .filter((c) =>
  //   (c.contents === undefined || c.contents.length === 0)
  //   && (c.children === undefined || c.children.length === 0),
  // )

  async removeUnusedFolders() {
    for (let i = 0; i < 3; i++) {
      await (this.compendium as CompendiumCollection.Any & { _reindexing?: Promise<void> })._reindexing;
      const folderIds = this.compendium.folders
        .filter((c) => (c.contents as unknown as unknown[]).length === 0 && (c.children as unknown as unknown[]).length === 0)
        .map((f) => f.id);
      logger.debug("Deleting compendium folders", folderIds);
      const chunkSize = 20;
      for (let i = 0; i < folderIds.length; i += chunkSize) {
        const chunk = folderIds.slice(i, i + chunkSize);
        logger.debug("Deleting compendium chunk folders", chunk);
        await Folder.deleteDocuments(chunk, { pack: this.packName });
      }
    }
  }

  static async cleanupCompendiumFolders(type: TCompendiumTypes, notifier: ((message: string, options?: { nameField: boolean }) => void) | null = null) {
    logger.info(`Cleaning ${type} compendium folders...`);
    const compendiumFolders = new DDBCompendiumFolders(type);
    if (notifier) notifier(`Cleaning compendium folders...`, { nameField: true });
    await compendiumFolders.loadCompendium(type, true);
    await compendiumFolders.compendium.getIndex({ fields: compendiumFolders.#getIndexFields() });
    await compendiumFolders.removeUnusedFolders();
    if (notifier) notifier(`Cleaning compendium folders complete`, { nameField: true });
  }

  static async generateCompendiumFolders(type: TCompendiumTypes, notifier: ((message: string, options?: { nameField: boolean }) => void) | null = null) {
    logger.info(`Migrating ${type} compendium`);
    const compendiumFolders = new DDBCompendiumFolders(type);
    if (notifier) notifier(`Checking compendium folders..`, { nameField: true });
    await compendiumFolders.loadCompendium(type);
    if (notifier) notifier("", { nameField: true });
  }
}
