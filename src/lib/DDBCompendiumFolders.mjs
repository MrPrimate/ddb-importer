import { DICTIONARY } from "../config/_module.mjs";
import { logger, utils, CompendiumHelper, DDBSources } from "./_module.mjs";

export class DDBCompendiumFolders {

  static DDB_COLOR = "#6f0006";

  static SCHEMA_SUPPORT = {
    "feature": 1,
    "class": 1,
    "race": 1,
    "trait": 1,
    "subclass": 1,
    "feat": 1,
  };

  resetFolderLookups() {
    this.validFolderIds = [];
    this.classFolders = {};
    this.subClassFeaturesFolder = {};
    this.backgroundFolders = {};
  }

  constructor(type, { packName = null, noCreateClassFolders = false } = {}) {
    this.type = type;
    this.packName = packName;
    this.resetFolderLookups();

    this.entityTypes = utils.entityMap();
    this.entityType = this.entityTypes.get(type);

    // this.monsterFolders = {};
    // this.spellFolders = {};
    // this.itemFolders = {};

    this.compendiumFolderTypeMonster = game.settings.get("ddb-importer", "munching-selection-compendium-folders-monster");
    this.compendiumFolderTypeSpell = game.settings.get("ddb-importer", "munching-selection-compendium-folders-spell");
    this.compendiumFolderTypeItem = game.settings.get("ddb-importer", "munching-selection-compendium-folders-item");

    this.noCreateClassFolders = noCreateClassFolders;
  }

  async addCompendiumFolderIds(documents) {
    const results = documents.map(async (d) => {
      const folderId = await this.getFolderId(d);
      // eslint-disable-next-line require-atomic-updates
      if (folderId) d.folder = folderId;
      return d;
    });
    return Promise.all(results);
  }

  async loadCompendium(type = null, noCreate = false) {
    if (type) {
      this.packName = await CompendiumHelper.getCompendiumLabel(type);
      this.entityType = this.entityTypes.get(type);
    }
    this.compendium = CompendiumHelper.getCompendium(this.packName);
    if (!noCreate) await this.createCompendiumFolders();
  }

  _createCompendiumFolderData({ name, parentId = null, color = "", folderId = null, flagTag = "" } = {}) {
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

  async createCompendiumFolder({ name, parentId, color, folderId, flagTag } = {}) {
    const data = this._createCompendiumFolderData({ name, parentId, color, folderId, flagTag });
    const folder = await CompendiumHelper.createFolder(data);
    return folder;
  }

  async createCreatureTypeFolders({ categoryFolderKey = undefined, categoryFolderId = undefined } = {}) {
    for (const monsterType of CONFIG.DDB.monsterTypes) {
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
  }

  static getCreatureTypeFolderNameForTypeSourceCategory(document) {
    const creatureType = document.system?.details?.type?.value
      ? document.system?.details?.type?.value
      : "Unknown";
    const ddbType = CONFIG.DDB.monsterTypes.find((c) => creatureType.toLowerCase() == c.name.toLowerCase());

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

  async createChallengeRatingFolders({ categoryFolderKey = undefined, categoryFolderId = undefined } = {}) {
    for (const cr of CONFIG.DDB.challengeRatings) {
      const paddedCR = String(cr.value).padStart(2, "0");
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
  }

  static getChallengeRatingFolderNameForTypeSourceCategory(document) {
    const paddedCR = String(document.system.details.cr ?? "0").padStart(2, "0");

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

  // spell level
  async createSpellLevelFolders({ categoryFolderKey = undefined, categoryFolderId = undefined } = {}) {
    for (const levelName of DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL) {
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
  }

  static getSpellFolderNameForTypeSourceCategory(document) {
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

  async generateFolderFromData({ sourceKey = "", parentKeyData, parentKey, flagPrefix = "", data } = {}) {
    const sourceKeyFlagPrefix = sourceKey !== "" && !sourceKey.endsWith("/")
      ? `${sourceKey}/`
      : sourceKey;
    const parentKeyFlagPrefix = flagPrefix !== "" && !flagPrefix.endsWith("/")
      ? `${flagPrefix}/`
      : flagPrefix;
    for (const [key, folderData] of Object.entries(data.subFolders)) {
      const flagTag = `${sourceKeyFlagPrefix}${parentKeyFlagPrefix}${key}/${folderData.folderName}`;
      logger.debug(`Checking for folder '${folderData.folderName}' with key '${key}' with parent key '${parentKey}' and flag tag '${flagTag}'`);

      const folder = this.getFolder(folderData.folderName, flagTag)
        ?? (await this.createCompendiumFolder({
          name: folderData.folderName,
          parentId: parentKeyData.folder?._id,
          color: folderData.color ?? "#222222",
          flagTag,
        }));
      // eslint-disable-next-line require-atomic-updates
      parentKeyData.subFolders[key] = {
        key,
        folder,
        subFolders: {},
      };
      this.validFolderIds.push(folder._id);
    };
  }

  async _createSourceFolder(name, flagTag, color = "") {
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


  async #createSourceFolderFromDocument(document, type) {
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

  // item type folder
  async createItemTypeCompendiumFolders({
    categoryFolderKey = undefined, categoryFolderId = undefined,
    sourceFolderKey = undefined, sourceFolderId = undefined, flagList = null,
  } = {}) {
    const TYPE_FOLDERS = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders;
    for (const [key, data] of Object.entries(TYPE_FOLDERS)) {
      logger.debug(`Checking for root folder '${data.folderName}' with key '${key}'`);
      const flagTag = categoryFolderId
        ? DDBCompendiumFolders.getSourceCategoryFolderName({
          categoryId: categoryFolderKey,
          type: key,
        }).flagTag
        : sourceFolderId
          ? DDBCompendiumFolders.getSourceFolderName({
            bookCode: sourceFolderKey,
            type: key,
          }).flagTag
          : key;
      const folder = this.getFolder(data.folderName, flagTag)
        ?? (await this.createCompendiumFolder({
          name: data.folderName,
          flagTag,
          color: data.color,
          parentId: categoryFolderId ?? sourceFolderId,
        }));
      this.validFolderIds.push(folder._id);

      if (!data.subFolders) continue;
      for (const [subKey, subData] of Object.entries(data.subFolders)) {
        logger.debug(`Checking for ${categoryFolderKey}, ${flagTag} sub folder '${subData.folderName}' with key '${subKey}'`);

        const subFlagTag = `${flagTag}/${subKey}`;
        if (flagList && !flagList.has(subFlagTag)) continue;
        const subFolder = this.getFolder(subData.folderName, subFlagTag)
          ?? (await this.createCompendiumFolder({
            name: subData.folderName,
            parentId: folder._id,
            color: subData.color ?? "#222222",
            flagTag: subFlagTag,
          }));
        this.validFolderIds.push(subFolder._id);

      }
    }
  }

  async createItemTypeFoldersWithSources() {
    const index = await this.compendium.getIndex({ fields: this.#getIndexFields() });
    // const sources = new Set(index.filter((s) => s.system?.source.book).map((s) => s.system.source.book));

    const sources = new Set();
    const flagList = new Set();

    for (const i of index) {
      const d = DDBCompendiumFolders.getItemFolderNameForTypeSource(i, "item");
      flagList.add(d.flagTag);
      sources.add(d.result.bookCode);
    }

    const sourceFoldersData = DDBCompendiumFolders.getAllSourceFolders("item")
      .filter((f) => sources.has(f.bookCode));

    for (const data of sourceFoldersData) {
      const sourceFolder = await this._createSourceFolder(data.name, data.flagTag);
      await this.createItemTypeCompendiumFolders({
        sourceFolderKey: data.bookCode,
        sourceFolderId: sourceFolder._id,
        flagList,
      });
    }
  }

  async createItemTypeFoldersWithSourceCategories(restrict = false) {
    const index = await this.compendium.getIndex({ fields: this.#getIndexFields() });
    // const sources = new Set(index.filter((s) => s.system?.source.book).map((s) => s.system.source.book));

    const sources = new Set();
    const categories = new Set();
    const flagList = new Set();

    if (restrict) {
      for (const i of index) {
        const d = DDBCompendiumFolders.getItemFolderNameForTypeSourceCategory(i, "item");
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

  async createFeatFolder(document) {
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

  async createFeatureFolder(className, name, parentId, { tagPrefix = "features", color = "#222222" } = {}) {
    const flagTag = `${tagPrefix}/${className}/${name}`;
    const folder = this.getFolder(name, flagTag)
      ?? (await this.createCompendiumFolder({ name, parentId, color, flagTag }));
    this.validFolderIds.push(folder._id);
    return folder;
  }

  async createClassFolder(className) {
    const classFolder = this.getFolder(className)
      ?? (await this.createCompendiumFolder({ name: className }));
    this.classFolders[className] = classFolder._id;
    this.validFolderIds.push(classFolder._id);
    return classFolder;
  }

  async createClassFeatureFolder(className) {
    logger.debug(`Checking for class folder '${className}'`);
    const classFolderId = this.classFolders[className]
      ?? (await this.createClassFolder(className))._id;
    const flagTag = `features/${className}`;
    const classFeaturesFolder = this.getFolder("Class Features", flagTag)
      ?? (await this.createCompendiumFolder({
        name: "Class Features",
        parentId: classFolderId,
        color: "#222222",
        flagTag,
      }));
    this.validFolderIds.push(classFeaturesFolder._id);

    await this.createFeatureFolder(className, "Optional Features", classFolderId);

    if (className === "Artificer") {
      await this.createFeatureFolder(className, "Infusions", classFolderId);
    } else if (className === "Sorcerer") {
      await this.createFeatureFolder(className, "Metamagic", classFolderId);
    } else if (className === "Warlock") {
      await this.createFeatureFolder(className, "Invocations", classFolderId);
      await this.createFeatureFolder(className, "Packs", classFolderId);
    }
  }

  async createClassFeatureFolders() {
    if (this.noCreateClassFolders) return;

    const classNames = CONFIG.DDB.classConfigurations
      .filter((c) => !c.name.includes("archived") && !c.name.includes("(UA)"))
      .map((c) => c.name);

    for (const className of classNames) {
      await this.createClassFeatureFolder(className);
    }
  }

  async createClassFeaturesHolderFolder(parentClassName, parentId) {
    const subClassFlag = `features/subclass/${parentClassName}`;
    const subClassFolder = this.getFolder("Subclass Features", subClassFlag)
        ?? (await this.createCompendiumFolder({
          name: "Subclass Features",
          parentId,
          color: "#222222",
          flagTag: subClassFlag,
        }));
    this.subClassFeaturesFolder[parentClassName] = subClassFolder._id;
    this.validFolderIds.push(subClassFolder._id);
    return subClassFolder;
  }

  async createSubClassFeatureFolder(subclassName, parentClassName) {
    logger.debug(`Checking for Subclass folder '${subclassName}' with Parent Class '${parentClassName}'`);

    const classFolderId = this.classFolders[parentClassName]
     ?? (await this.createClassFolder(parentClassName))._id;
    await this.createClassFeatureFolder(parentClassName);
    const subClassFolderId = this.subClassFeaturesFolder[parentClassName]
      ?? (await this.createClassFeaturesHolderFolder(parentClassName, classFolderId))._id;

    // create actual folder
    const flagTag = `features/${subclassName}`;
    const folder = this.getFolder(subclassName, flagTag)
      ?? (await this.createCompendiumFolder({
        name: `${subclassName}`,
        parentId: subClassFolderId,
        color: "#222222",
        flagTag,
      }));
    this.validFolderIds.push(folder._id);

    if (parentClassName === "Fighter" && subclassName === "Battle Master") {
      await this.createFeatureFolder(subclassName, "Maneuver Options", classFolderId);
    } else if (parentClassName === "Fighter" && subclassName === "Rune Knight") {
      await this.createFeatureFolder(subclassName, "Runes", classFolderId);
    }
  }

  async getSpeciesBaseFolder(baseSpeciesName) {
    logger.debug(`Checking for species folder '${baseSpeciesName}'`);
    const existingFolder = this.getFolder(baseSpeciesName, `species/${baseSpeciesName}`);
    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating species folder '${baseSpeciesName}'`);
    const newFolder = await this.createCompendiumFolder({
      name: baseSpeciesName,
      flagTag: `species/${baseSpeciesName}`,
    });
    this.validFolderIds.push(newFolder._id);
    return newFolder;
  }

  async createBaseSpeciesFolders() {
    const raceNames = CONFIG.DDB.raceGroups.map((c) => c.name);
    for (const raceName of raceNames) {
      await this.getSpeciesBaseFolder(raceName);
    }
  }

  async createSubTraitFolders(baseSpeciesName, fullSpeciesName) {
    const flagTag = `trait/${baseSpeciesName}/${fullSpeciesName}`;
    logger.debug(`Checking for Species folder '${fullSpeciesName}' with Base Species '${baseSpeciesName}'`);

    const parentFolder = await this.getSpeciesBaseFolder(baseSpeciesName);

    const name = fullSpeciesName === baseSpeciesName
      ? "Traits"
      : `${fullSpeciesName} Traits`;

    const folder = this.getFolder(fullSpeciesName, flagTag)
      ?? (await this.createCompendiumFolder({
        name,
        parentId: parentFolder._id,
        color: "#222222",
        flagTag,
      }));
    this.validFolderIds.push(folder._id);
  }

  async createSummonsFolder(type) {
    const flagTag = `summons/${type}`;
    logger.debug(`Checking for Summons folder '${type}'`);
    const existingFolder = this.getFolder(type, flagTag);
    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating summons folder '${type}'`);
    const newFolder = await this.createCompendiumFolder({
      name: type,
      flagTag,
    });
    this.validFolderIds.push(newFolder._id);
    return newFolder;
  }

  async createBackgroundFolder(document) {
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

  async createSummonsSubFolder(type, subFolderName) {
    const flagTag = `summons/${type}/${subFolderName}`;
    logger.debug(`Checking for Summons folder '${subFolderName}' with Base Folder '${subFolderName}'`);

    const parentFolder = await this.createSummonsFolder(type);

    const folder = this.getFolder(subFolderName, flagTag)
      ?? (await this.createCompendiumFolder({
        name: subFolderName,
        parentId: parentFolder._id,
        color: "#222222",
        flagTag,
      }));
    this.validFolderIds.push(folder._id);
  }

  // eslint-disable-next-line complexity
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
          case "SOURCE_TYPE":
            await this.createItemTypeFoldersWithSources();
            break;
          case "SOURCE_CATEGORY_TYPE":
            await this.createItemTypeFoldersWithSourceCategories();
            break;
          // no default
        }
        break;
      }
      case "subclass":
      case "subclasses":
      case "features": {
        await this.createClassFeatureFolders();
        break;
      }
      // others are created as needed
      // no default
    }
    return this.compendium.folders;
  }

  static getItemFolderNameForRarity(document, useSource = false) {
    let name;
    const rarity = document.system.rarity;

    if (rarity && rarity != "") {
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

  // eslint-disable-next-line complexity
  static getItemFolderNameForType(document) {
    const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
    const ddbTypeId = utils.idString(ddbType ?? "").toLowerCase();
    const typeFolderRoot = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders[document.type]
      ?? (ddbType
        ? DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders[ddbTypeId]
        : null);

    const systemType = document.system?.type?.value;

    let subTypeFolder = null;

    const parsed = {
      name: typeFolderRoot?.folderName
        ?? "Unknown",
      type: document.type,
      suffix: null,
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
    } else if (typeFolderRoot?.subFolders?.[systemType]) {
      subTypeFolder = typeFolderRoot.subFolders[systemType];
      parsed.suffix = systemType;
    }

    if (ddbTypeId === "tattoo") {
      parsed.type = "tattoo";
    }

    if (subTypeFolder) {
      parsed.subType = true;
      if (subTypeFolder.color) parsed.color = subTypeFolder.color;
      parsed.name = subTypeFolder.folderName;
    }

    if (document.type === "equipment" && systemType === "trinket") {
      const isContainer = foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.isContainer") === true;
      if (isContainer) {
        parsed.name = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders["container"].subFolders[ddbTypeId].folderName;
        // parsed.suffix = utils.idString(parsed.name).toLowerCase();
        parsed.suffix = ddbTypeId;
        parsed.type = "container";
        parsed.parentFolderName = DICTIONARY.COMPENDIUM_FOLDERS.TYPE_FOLDERS.subFolders["container"].folderName;
      }
    } else if (document.type === "tool") {
      const instrument = document.flags?.ddbimporter?.dndbeyond?.tags.includes("Instrument");
      const ddbTypes = ["art", "music", "game"].includes(systemType);
      if (instrument) {
        parsed.name = typeFolderRoot.subFolders["music"].folderName;
        parsed.suffix = "music";
      } else if (ddbTypes) {
        parsed.name = typeFolderRoot.subFolders[systemType].folderName;
        parsed.suffix = systemType;
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

  static getItemFolderNameForTypeSource(document, sourceType = null) {
    const folderData = this.getItemFolderNameForType(document);

    const parent = folderData.subTypeFolder
      ? DDBCompendiumFolders.getSourceFolderNameFromDocument({
        type: sourceType ?? folderData.parsed.type,
        document,
        nameSuffix: folderData.parsed.parentFolderName,
      })
      : null;

    const result = DDBCompendiumFolders.getSourceFolderNameFromDocument({
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


  static getItemFolderNameForTypeSourceCategory(document, sourceType = null) {
    const folderData = this.getItemFolderNameForType(document);

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

  getItemCompendiumFolderName(document) {
    let name;
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
      case "SOURCE_TYPE": {
        name = DDBCompendiumFolders.getItemFolderNameForTypeSource(document, "item");
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

  // eslint-disable-next-line class-methods-use-this, complexity
  getClassFeatureFolderName(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };
    const subClassName = foundry.utils.getProperty(document, "flags.ddbimporter.subClass");
    const className = foundry.utils.getProperty(document, "flags.ddbimporter.class");
    const optional = foundry.utils.getProperty(document, "flags.ddbimporter.optionalFeature");
    const infusion = foundry.utils.getProperty(document, "flags.ddbimporter.infusionFeature");
    const subType = foundry.utils.getProperty(document, "system.type.subtype");

    const validSubclass = subClassName && subClassName.trim() !== "";
    const validClass = className && className.trim() !== "";

    if (infusion) {
      result.name = "Infusions";
      result.flagTag = `features/${className}/Infusions`;
    } else if (optional) {
      result.name = "Optional Features";
      result.flagTag = `features/${className}/Optional Features`;
    // specialist folders
    } else if (subType === "metamagic" && className === "Sorcerer") {
      result.name = "Metamagic";
      result.flagTag = `features/${className}/Metamagic`;
    } else if (subType === "pact" && className === "Warlock") {
      result.name = "Pacts";
      result.flagTag = `features/${className}/Pacts`;
    } else if (subType === "eldritchInvocation" && className === "Warlock") {
      result.name = "Invocations";
      result.flagTag = `features/${className}/Invocations`;
    } else if (subType === "maneuver" && className === "Fighter") {
      result.name = "Maneuver Options";
      result.flagTag = `features/${subClassName}/Maneuver Options`;
    } else if (subType === "rune" && className === "Fighter") {
      result.name = "Runes";
      result.flagTag = `features/${subClassName}/Runes`;
    } else if (validSubclass) {
      result.name = subClassName;
      result.flagTag = `features/${subClassName}`;
    } else if (validClass) {
      result.name = "Class Features";
      result.flagTag = `features/${className}`;
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

  // eslint-disable-next-line class-methods-use-this
  getRaceTraitFolderName(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };
    // "flags.ddbimporter.baseRaceName",
    // "flags.ddbimporter.baseName",
    // "flags.ddbimporter.subRaceShortName",
    // "flags.ddbimporter.isSubRace",
    // const isSubRace = foundry.utils.getProperty(document, "flags.ddbimporter.isSubRace");
    // const baseRaceName = foundry.utils.getProperty(document, "flags.ddbimporter.baseRaceName");
    // const baseName = foundry.utils.getProperty(document, "flags.ddbimporter.baseName");
    // const subRaceShortName = foundry.utils.getProperty(document, "flags.ddbimporter.subRaceShortName");
    const fullSpeciesName = foundry.utils.getProperty(document, "flags.ddbimporter.fullRaceName");
    // const name = document.name;
    // const lowercaseName = name.toLowerCase();

    const groupName = foundry.utils.getProperty(document, "flags.ddbimporter.groupName");
    const isLineage = foundry.utils.getProperty(document, "flags.ddbimporter.isLineage");
    const tagName = isLineage ? groupName : fullSpeciesName;

    result.name = fullSpeciesName === groupName || isLineage
      ? "Traits"
      : `${fullSpeciesName} Traits`;
    result.flagTag = `trait/${groupName}/${tagName}`;

    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  getRaceFolderName(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };

    const fullSpeciesName = foundry.utils.getProperty(document, "flags.ddbimporter.fullRaceName");
    const groupName = foundry.utils.getProperty(document, "flags.ddbimporter.groupName");
    result.name = groupName ?? fullSpeciesName;
    result.flagTag = `species/${(groupName ?? fullSpeciesName)}`;

    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  getSummonFolderName(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };

    const folderHint = foundry.utils.getProperty(document, "flags.ddbimporter.summons.folder");
    const summonHint = foundry.utils.getProperty(document, "flags.ddbimporter.summons.name");
    result.name = folderHint ?? summonHint ?? document.name;
    result.flagTag = `summon/${result.name}`;

    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  getClassFolderName(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };
    const className = foundry.utils.getProperty(document, "flags.ddbimporter.class");
    if (className && className.trim() !== "") {
      result.name = className;
    } else {
      result.name = "Unknown";
    }

    if (result.name) return result;
    else return undefined;
  }

  static getSourceCategoryFolderName({
    categoryId, bookCode, isLegacy = false, type, noSourceNameOverride = null, nameSuffix = "", flagSuffix = "",
  } = {}) {
    const result = {
      name: undefined,
      flagTag: "",
      parent: false,
      bookCode,
      categoryId,
      categoryName: null,
      color: "",
    };

    const suffix = flagSuffix && flagSuffix.trim() !== ""
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
    const categoryName = categoryData?.name;

    if (categoryName) {
      result.color = DICTIONARY.COMPENDIUM_FOLDERS.SOURCE_CATEGORY_FOLDERS[resolvedCategoryId]?.color ?? "";
      result.name = nameSuffix === "" ? categoryName : nameSuffix;
      result.flagTag = `${type}/${resolvedCategoryId}${suffix}`;
      result.parent = true;
      result.categoryName = categoryName;
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
  } = {}) {
    const source = foundry.utils.getProperty(document, "system.source.book");
    const legacy = foundry.utils.getProperty(document, "flags.ddbimporter.legacy");

    return DDBCompendiumFolders.getSourceCategoryFolderName({
      bookCode: source,
      isLegacy: legacy,
      type,
      noSourceNameOverride,
      nameSuffix,
      flagSuffix,
    });
  }

  static getSourceFolderName({ bookCode, isLegacy = false, type, noSourceNameOverride = null, nameSuffix = "", flagSuffix = "" } = {}) {
    const result = {
      name: undefined,
      flagTag: "",
      parent: false,
      bookCode,
    };

    const suffix = flagSuffix && flagSuffix.trim() !== ""
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
  } = {}) {
    const source = foundry.utils.getProperty(document, "system.source.book");
    const legacy = foundry.utils.getProperty(document, "flags.ddbimporter.legacy");

    return DDBCompendiumFolders.getSourceFolderName({
      bookCode: source,
      isLegacy: legacy,
      type,
      noSourceNameOverride,
      nameSuffix,
      flagSuffix,
    });
  }

  static getAllSourceFolders(type) {
    const results = [];
    for (const key of Object.keys(CONFIG.DND5E.sourceBooks)) {
      results.push(DDBCompendiumFolders.getSourceFolderName({
        type,
        bookCode: key,
      }));
    }
    return results;
  }

  static getAllSourceCategoryFolders(type) {
    const results = [];
    for (const data of CONFIG.DDB.sourceCategories) {
      results.push(DDBCompendiumFolders.getSourceCategoryFolderName({
        type,
        categoryId: data.id,
      }));
    }
    return results;
  }

  static getFeatFolderName(document) {
    const type = foundry.utils.getProperty(document, "system.type.subtype");
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

  static getBackgroundFolderName(document) {
    return DDBCompendiumFolders.getSourceFolderNameFromDocument({ document, type: "background" });
  }

  // eslint-disable-next-line complexity
  getCompendiumFolderData(document) {
    let data;
    switch (this.type) {
      case "background":
      case "backgrounds": {
        data = DDBCompendiumFolders.getBackgroundFolderName(document);
        break;
      }
      case "feat":
      case "feats": {
        data = DDBCompendiumFolders.getFeatFolderName(document);
        break;
      }
      case "trait":
      case "traits": {
        data = this.getRaceTraitFolderName(document);
        break;
      }
      case "species":
      case "race":
      case "races": {
        data = this.getRaceFolderName(document);
        break;
      }
      case "feature":
      case "features": {
        data = this.getClassFeatureFolderName(document);
        break;
      }
      case "class":
      case "classes":
      case "subclass":
      case "subclasses": {
        data = this.getClassFolderName(document);
        break;
      }
      case "summon":
      case "summons": {
        data = this.getSummonFolderName(document);
        break;
      }
      case "monsters":
      case "npc":
      case "monster": {
        switch (this.compendiumFolderTypeMonster) {
          case "TYPE": {
            const creatureType = document.system?.details?.type?.value
              ? document.system?.details?.type?.value
              : "Unknown";
            const ddbType = CONFIG.DDB.monsterTypes.find((c) => creatureType.toLowerCase() == c.name.toLowerCase());
            if (ddbType) data = {
              name: ddbType.name,
              flagTag: "",
            };
            break;
          }
          case "SOURCE_CATEGORY_TYPE": {
            data = DDBCompendiumFolders.getCreatureTypeFolderNameForTypeSourceCategory(document);
            break;
          }
          case "ALPHA": {
            data = document.name
              .replace(/[^a-z]/gi, "")
              .charAt(0)
              .toUpperCase();
            break;
          }
          case "CR": {
            if (document.system.details.cr !== undefined || document.system.details.cr !== "") {
              const paddedCR = String(document.system.details.cr).padStart(2, "0");
              data = {
                name: `CR ${paddedCR}`,
                flagTag: "",
              };
            }
            break;
          }
          case "SOURCE_CATEGORY_CR": {
            data = DDBCompendiumFolders.getChallengeRatingFolderNameForTypeSourceCategory(document);
            break;
          }
          // no default
        }
        break;
      }
      case "spell":
      case "spells": {
        switch (this.compendiumFolderTypeSpell) {
          case "SCHOOL": {
            const school = document.system?.school;
            if (school) {
              data = utils.capitalize(DICTIONARY.spell.schools.find((sch) => school == sch.id).name);
            }
            break;
          }
          case "LEVEL": {
            const levelFolder = DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL[document.system?.level];
            data = {
              name: levelFolder,
              flagTag: null,
            };
            break;
          }
          case "SOURCE_CATEGORY_LEVEL": {
            data = DDBCompendiumFolders.getSpellFolderNameForTypeSourceCategory(document);
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
          data = this.getItemCompendiumFolderName(document);
        } catch (e) {
          logger.error("Error in getItemCompendiumFolderName", { error: e, document });
          throw e;
        }
      }
      // no default
    }
    return data;
  }

  getFolder(folderName, flagTag = "") {
    const folder = this.compendium.folders.find((f) =>
      f.name === folderName
      && f.flags?.ddbimporter?.flagTag === flagTag,
    );
    return folder;
  }

  getFolderId(document) {
    const folderName = this.getCompendiumFolderData(document);
    if (folderName) {
      const folder = this.getFolder((folderName.name ?? folderName), (folderName.flagTag ?? ""));
      if (folder) return folder._id;
    }
    return undefined;
  }

  async addToCompendiumFolder(document) {
    logger.debug(`Checking ${document.name} in ${this.packName}`);

    const folderName = this.getCompendiumFolderData(document);
    if (folderName) {
      const folder = this.compendium.folders.find((f) => f.name == (folderName.name ?? folderName));
      if (folder) {
        logger.info(`Moving ${this.type} ${document.name} to folder ${folder.name}`);
        await document.update({ folder: folder._id });
      } else {
        logger.error(`Unable to find folder "${folderName}" in "${this.packName}" for ${this.type}`);
      }
    }
  }


  // eslint-disable-next-line complexity
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
          "flags.ddbimporter.legacy",
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
          "system.type.subtype",
          "system.source.book",
          "flags.ddbimporter.legacy",
        ];
      }
      case "feat":
      case "feats": {
        return [
          "name",
          "system.type.subtype",
          "system.source.book",
          "flags.ddbimporter.legacy",
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
          "system.source.book",
          "flags.ddbimporter.legacy",
        ];
      }
      case "background":
      case "backgrounds": {
        return [
          "name",
          "system.source.book",
          "flags.ddbimporter.legacy",
        ];
      }
      default:
        return [
          "name",
          "system.type.subtype",
          "system.source.book",
          "flags.ddbimporter.legacy",
        ];
    }
  }

  // eslint-disable-next-line complexity
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

    const results = [];
    for (const i of index) {
      const folderId = this.getFolderId(i);
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
      case "npc":
      case "monster": {
        const chunkSize = 250;
        for (let i = 0; i < results.length; i += chunkSize) {
          const chunk = results.slice(i, i + chunkSize);
          logger.debug("Updating chunk actors", chunk);
          await Actor.updateDocuments(chunk, { pack: this.packName });
        }
        break;
      }
      default: {
        const chunkSize = 250;
        for (let i = 0; i < results.length; i += chunkSize) {
          const chunk = results.slice(i, i + chunkSize);
          logger.debug("Updating chunk items", chunk);
          await Item.updateDocuments(chunk, { pack: this.packName });
        }
        break;
      }
    }

    if (cleanup) await this.removeUnusedFolders();

    return this.compendium.folders;
  }

  static async migrateExistingCompendium(type, { folderStructure = null, cleanup = true, deleteExisting = true } = {}) {
    if (folderStructure) {
      await game.settings.set("ddb-importer", `munching-selection-compendium-folders-${type.replace(/s+$/, "")}`);
    }
    const compendiumFolders = new DDBCompendiumFolders(type);
    await compendiumFolders.loadCompendium(type, true);
    await compendiumFolders._migrateExistingCompendium({ deleteExisting, cleanup });
  }

  async removeUnusedFolders() {
    for (let i = 0; i < 3; i++) {
      const folderIds = this.compendium.folders
        .filter((c) => c.contents.length === 0 && c.children.length === 0)
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

  static async cleanupCompendiumFolders(type, notifier = null) {
    logger.info(`Cleaning ${type} compendium folders...`);
    const compendiumFolders = new DDBCompendiumFolders(type);
    if (notifier) notifier(`Cleaning compendium folders...`, true);
    await compendiumFolders.loadCompendium(type, true);
    await compendiumFolders.compendium.getIndex({ fields: compendiumFolders.#getIndexFields() });
    await compendiumFolders.removeUnusedFolders();
    if (notifier) notifier(`Cleaning compendium folders complete`, true);
  }

  static async generateCompendiumFolders(type, notifier = null) {
    logger.info(`Migrating ${type} compendium`);
    const compendiumFolders = new DDBCompendiumFolders(type);
    if (notifier) notifier(`Checking compendium folders..`, true);
    await compendiumFolders.loadCompendium(type);
    if (notifier) notifier("", true);
  }
}
