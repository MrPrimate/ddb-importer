import { DICTIONARY } from "../config/_module.mjs";
import { logger, utils, CompendiumHelper } from "./_module.mjs";

export class DDBCompendiumFolders {

  static SCHEMA_SUPPORT = {
    "feature": 1,
    "class": 1,
    "race": 1,
    "trait": 1,
    "subclass": 1,
    "feat": 1,
  };

  resetFolderLookups() {
    this.rootItemFolders = {};
    this.equipmentFolders = {};
    this.weaponFolders = {};
    this.trinketFolders = {};
    this.consumableFolders = {};
    this.lootFolders = {};
    this.toolFolders = {};
    this.containerFolders = {};
    this.validFolderIds = [];
    this.classFolders = {};
    this.subClassFolders = {};
    this.subClassFeaturesFolder = {};
    this.speciesFolders = {};
    this.traitSubFolders = {};
    this.summonFolders = {};
    this.summonSubFolders = {};
    this.featFolders = {};
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

  async loadCompendium(type = null) {
    if (type) {
      this.packName = await CompendiumHelper.getCompendiumLabel(type);
      this.entityType = this.entityTypes.get(type);
    }
    this.compendium = CompendiumHelper.getCompendium(this.packName);
    await this.createCompendiumFolders();
  }

  async createCompendiumFolder({ name, parentId = null, color = "#6f0006", folderId = null, flagTag = "" } = {}) {
    const folder = await CompendiumHelper.createFolder({
      pack: this.compendium,
      name,
      parentId,
      color,
      folderId,
      flagTag,
      entityType: this.entityType,
    });
    return folder;
  }

  async createCreatureTypeCompendiumFolders() {
    for (const monsterType of CONFIG.DDB.monsterTypes) {
      const folder = this.getFolder(monsterType.name)
        ?? (await this.createCompendiumFolder({ name: monsterType.name, color: "#6f0006" }));
      this.validFolderIds.push(folder._id);
    }
  }

  async createAlphabeticalCompendiumFolders() {
    for (let i = 9; ++i < 36;) {
      const folderName = i.toString(36).toUpperCase();
      const folder = this.getFolder(folderName)
        ?? (await this.createCompendiumFolder({ name: folderName, color: "#6f0006" }));
      this.validFolderIds.push(folder._id);
    }
  }

  async createChallengeRatingCompendiumFolders() {
    for (const cr of CONFIG.DDB.challengeRatings) {
      const paddedCR = String(cr.value).padStart(2, "0");
      const folder = this.getFolder(`CR ${paddedCR}`)
        ?? (await this.createCompendiumFolder({ name: `CR ${paddedCR}`, color: "#6f0006" }));
      this.validFolderIds.push(folder._id);
    }
  }

  // spell level
  async createSpellLevelCompendiumFolders() {
    for (const levelName of DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL) {
      logger.debug(`Checking for folder '${levelName}'`);
      const folder = this.getFolder(levelName)
        ?? (await this.createCompendiumFolder({ name: levelName }));
      this.validFolderIds.push(folder._id);
    }
  }

  // spell school
  async createSpellSchoolCompendiumFolders() {
    for (const school of DICTIONARY.spell.schools) {
      const schoolName = utils.capitalize(school.name);
      logger.debug(`Checking for folder '${schoolName}'`);
      const folder = this.getFolder(schoolName)
        ?? (await this.createCompendiumFolder({ name: schoolName }));
      this.validFolderIds.push(folder._id);
    }
  }

  // item rarity folder
  async createItemRarityCompendiumFolders() {
    for (const rarityName of DICTIONARY.COMPENDIUM_FOLDERS.RARITY) {
      logger.debug(`Checking for folder '${rarityName}'`);
      const folder = this.getFolder(rarityName, rarityName)
        ?? (await this.createCompendiumFolder({ name: rarityName, flagTag: rarityName }));
      this.validFolderIds.push(folder._id);
    }
  }

  // item type folder
  async createItemTypeCompendiumFolders() {
    for (const [key, folderName] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.ITEM_ROOT)) {
      const flagTag = folderName;
      logger.debug(`Checking for root folder '${folderName}' with key '${key}'`);
      const folder = this.getFolder(folderName, flagTag)
        ?? (await this.createCompendiumFolder({ name: folderName, flagTag: folderName }));
      this.rootItemFolders[key] = folder;
      this.validFolderIds.push(folder._id);
    }

    logger.debug("Root item folders", this.rootItemFolders);

    for (const [key, folderName] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.EQUIPMENT)) {
      const flagTag = `equipment/${folderName}`;
      logger.debug(`Checking for Equipment folder '${folderName}' with key '${key}'`);

      const folder = this.getFolder(folderName, flagTag)
        ?? (await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["equipment"]._id, color: "#222222", flagTag }));
      this.equipmentFolders[key] = folder;
      this.validFolderIds.push(folder._id);
    }

    for (const [key, folderName] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.WEAPON)) {
      const flagTag = `weapon/${folderName}`;
      logger.debug(`Checking for Weapon folder '${folderName}' with key '${key}'`);
      const folder = this.getFolder(folderName, flagTag)
        ?? (await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["weapon"]._id, color: "#222222", flagTag }));
      this.weaponFolders[key] = folder;
      this.validFolderIds.push(folder._id);
    }

    for (const [key, folderName] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.TOOLS)) {
      const flagTag = `tool/${folderName}`;
      logger.debug(`Checking for Tool folder '${folderName}' with key '${key}'`);
      const folder = this.getFolder(folderName, flagTag)
        ?? (await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["tool"]._id, color: "#222222", flagTag }));
      this.toolFolders[key] = folder;
      this.validFolderIds.push(folder._id);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.TRINKET) {
      const flagTag = `trinket/${folderName}`;
      logger.debug(`Checking for Equipment\\Trinket folder '${folderName}'`);
      const folder = this.getFolder(folderName, flagTag)
       ?? (await this.createCompendiumFolder({ name: folderName, parentId: this.equipmentFolders["trinket"]._id, color: "#444444", flagTag }));
      this.trinketFolders[folderName] = folder;
      this.validFolderIds.push(folder._id);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.CONSUMABLE) {
      const flagTag = `consumable/${folderName}`;
      logger.debug(`Checking for Consumable folder '${folderName}'`);
      const folder = this.getFolder(folderName, flagTag)
       ?? (await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["consumable"]._id, color: "#222222", flagTag }));
      this.consumableFolders[folderName] = folder;
      this.validFolderIds.push(folder._id);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.LOOT) {
      const flagTag = `loot/${folderName}`;
      logger.debug(`Checking for Loot folder '${folderName}'`);
      const folder = this.getFolder(folderName, flagTag)
       ?? (await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["loot"]._id, color: "#222222", flagTag }));
      this.lootFolders[folderName] = folder;
      this.validFolderIds.push(folder._id);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.CONTAINER) {
      const flagTag = `container/${folderName}`;
      logger.debug(`Checking for Container folder '${folderName}'`);
      const folder = this.getFolder(folderName, flagTag)
        ?? (await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["container"]._id, color: "#222222", flagTag }));
      this.containerFolders[folderName] = folder;
      this.validFolderIds.push(folder._id);
    }
  }

  async createFeatFolder(name, parentId, { color = "#222222" } = {}) {
    const flagTag = `feat/${name}`;
    const folder = this.getFolder(name, flagTag)
      ?? (await this.createCompendiumFolder({ name, parentId, color, flagTag }));
    this.validFolderIds.push(folder._id);
    this.featFolders[name] = folder._id;
    return folder;
  }

  async createFeatFolders() {
    for (const type of Object.keys(CONFIG.DND5E.featureTypes.feat.subtypes)) {
      const data = this._getFeatFlagData({ type });
      await this.createFeatFolder(data.name);
    }
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
    this.subClassFolders[subclassName] = folder;
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
    this.speciesFolders[baseSpeciesName] = newFolder;
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
    this.traitSubFolders[fullSpeciesName] = folder;
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
    this.summonFolders[type] = newFolder;
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
    this.summonSubFolders[subFolderName] = folder;
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
            await this.createCreatureTypeCompendiumFolders();
            break;
          }
          case "ALPHA": {
            await this.createAlphabeticalCompendiumFolders();
            break;
          }
          case "CR": {
            await this.createChallengeRatingCompendiumFolders();
            break;
          }
          // no default
        }
        break;
      }
      case "spell":
      case "spells": {
        switch (this.compendiumFolderTypeSpell) {
          case "SCHOOL":
            await this.createSpellSchoolCompendiumFolders();
            break;
          case "LEVEL":
            await this.createSpellLevelCompendiumFolders();
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
            await this.createItemRarityCompendiumFolders();
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
      case "feats":
      case "feat": {
        await this.createFeatFolders();
        break;
      }
      // others are created as needed
      // no default
    }
    return this.compendium.folders;
  }

  static getItemCompendiumFolderNameForRarity(document) {
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
    return { name, flagTag: name };
  }

  getItemCompendiumFolderNameForType(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };

    switch (document.type) {
      case "dnd-tashas-cauldron.tattoo":
      case "tattoo": {
        const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
        result.name = this.trinketFolders[ddbType].name;
        result.flagTag = `trinket/${result.name}`;
        break;
      }
      case "equipment": {
        switch (document.system?.type?.value) {
          case "trinket": {
            const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
            const isContainer = foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.isContainer") === true;
            result.name = isContainer
              ? this.containerFolders[ddbType].name
              : this.trinketFolders[ddbType].name;
            result.flagTag = isContainer
              ? `container/${result.name}`
              : `trinket/${result.name}`;
            break;
          }
          default: {
            result.name = this.equipmentFolders[document.system.type.value].name;
            result.flagTag = `equipment/${result.name}`;
            break;
          }
        }
        break;
      }
      case "weapon": {
        result.name = this.weaponFolders[document.system.type.value].name;
        result.flagTag = `weapon/${result.name}`;
        break;
      }
      case "consumable": {
        const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
        if (ddbType) {
          result.name = this.consumableFolders[ddbType].name;
          result.flagTag = `consumable/${result.name}`;
        }
        break;
      }
      case "loot": {
        const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
        if (ddbType) {
          result.name = this.lootFolders[ddbType].name;
          result.flagTag = `loot/${result.name}`;
        }
        break;
      }
      case "container": {
        const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
        if (ddbType) {
          result.name = this.containerFolders[ddbType].name;
          result.flagTag = `container/${result.name}`;
        }
        break;
      }
      case "tool": {
        const toolType = document.system.type.value;
        const instrument = document.flags?.ddbimporter?.dndbeyond?.tags.includes("Instrument");
        const ddbType = ["art", "music", "game"].includes(toolType);
        if (instrument) {
          result.name = this.toolFolders["music"].name;
          result.flagTag = `tool/${result.name}`;
        } else if (ddbType) {
          result.name = this.toolFolders[toolType].name;
          result.flagTag = `tool/${result.name}`;
        } else {
          result.name = this.rootItemFolders[document.type].name;
          result.flagTag = `Tools`;
        }

        break;
      }
      default: {
        result.name = this.rootItemFolders[document.type].name;
        result.flagTag = `${result.name}`;
        break;
      }
    }

    return result;
  }

  getItemCompendiumFolderName(document) {
    let name;
    switch (this.compendiumFolderTypeItem) {
      case "RARITY": {
        name = DDBCompendiumFolders.getItemCompendiumFolderNameForRarity(document);
        break;
      }
      case "TYPE": {
        name = this.getItemCompendiumFolderNameForType(document);
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

  // eslint-disable-next-line class-methods-use-this
  _getFeatFlagData({ type } = {}) {
    const result = {
      name: undefined,
      flagTag: "",
    };
    const name = CONFIG.DND5E.featureTypes.feat.subtypes[type];
    if (name) {
      result.name = `${name.replace(" Feat", "")}`;
      result.flagTag = `feat/${result.name}`;
    } else {
      result.name = "General";
      result.flagTag = "feat/General";
    }

    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  getFeatFolderName(document) {
    const type = foundry.utils.getProperty(document, "system.type.subtype");
    const result = this._getFeatFlagData({ type });

    return result;
  }

  // eslint-disable-next-line complexity
  getCompendiumFolderName(document) {
    let name;
    switch (this.type) {
      case "feat":
      case "feats": {
        name = this.getFeatFolderName(document);
        break;
      }
      case "trait":
      case "traits": {
        name = this.getRaceTraitFolderName(document);
        break;
      }
      case "species":
      case "race":
      case "races": {
        name = this.getRaceFolderName(document);
        break;
      }
      case "feature":
      case "features": {
        name = this.getClassFeatureFolderName(document);
        break;
      }
      case "class":
      case "classes":
      case "subclass":
      case "subclasses": {
        name = this.getClassFolderName(document);
        break;
      }
      case "summon":
      case "summons": {
        name = this.getSummonFolderName(document);
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
            if (ddbType) name = ddbType.name;
            break;
          }
          case "ALPHA": {
            name = document.name
              .replace(/[^a-z]/gi, "")
              .charAt(0)
              .toUpperCase();
            break;
          }
          case "CR": {
            if (document.system.details.cr !== undefined || document.system.details.cr !== "") {
              const paddedCR = String(document.system.details.cr).padStart(2, "0");
              name = `CR ${paddedCR}`;
            }
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
              name = utils.capitalize(DICTIONARY.spell.schools.find((sch) => school == sch.id).name);
            }
            break;
          }
          case "LEVEL": {
            const levelFolder = DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL[document.system?.level];
            if (levelFolder) {
              name = levelFolder;
            }
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
          name = this.getItemCompendiumFolderName(document);
        } catch (e) {
          logger.error("Error in getItemCompendiumFolderName", { error: e, document });
          throw e;
        }
      }
      // no default
    }
    return name;
  }

  getFolder(folderName, flagTag = "") {
    const folder = this.compendium.folders.find((f) =>
      f.name == folderName
      && f.flags?.ddbimporter?.flagTag === flagTag,
    );
    return folder;
  }

  getFolderId(document) {
    const folderName = this.getCompendiumFolderName(document);
    if (folderName) {
      const folder = this.getFolder((folderName.name ?? folderName), (folderName.flagTag ?? ""));
      if (folder) return folder._id;
    }
    return undefined;
  }

  async addToCompendiumFolder(document) {
    logger.debug(`Checking ${document.name} in ${this.packName}`);

    const folderName = this.getCompendiumFolderName(document);
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
        ];
      }
      case "summon":
      case "summons": {
        return [
          "name",
          "type",
          "flags.ddbimporter.summons.name",
          "flags.ddbimporter.summons.folder",
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
        ];
      }
      case "feat":
      case "feats": {
        return [
          "name",
          "system.type.subtype",
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
        ];
      }
      default:
        return ["name", "system.type.subtype"];
    }
  }

  // eslint-disable-next-line complexity
  async migrateExistingCompendium() {
    if (!this.compendium) return undefined;

    const foldersToRemove = this.compendium.folders.filter((f) => !this.validFolderIds.includes(f._id));
    await Folder.deleteDocuments(foldersToRemove.map((f) => f._id), { pack: this.packName });

    logger.debug("Remaining Compendium Folders", this.compendium.folders);

    const index = await this.compendium.getIndex({ fields: this.#getIndexFields() });

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
        await Actor.updateDocuments(results, { pack: this.packName });
        break;
      }
      default: {
        await Item.updateDocuments(results, { pack: this.packName });
        break;
      }
    }


    return this.compendium.folders;
  }

  async removeUnusedFolders() {
    const folderIds = this.compendium.folders
      .filter((c) => c.contents.length === 0 && c.children.length === 0)
      .map((f) => f.id);
    logger.debug("Deleting compendium folders", folderIds);
    await Folder.deleteDocuments(folderIds, { pack: this.packName });
  }
}
