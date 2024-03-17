/* eslint-disable no-await-in-loop */
import DICTIONARY from "../dictionary.js";
import logger from "../logger.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import utils from "./utils.js";

export class DDBCompendiumFolders {
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
    this.raceFolders = {};
    this.subRaceFolders = {};
    this.traitFolders = {};
    this.traitSubFolders = {};
  }

  constructor(type, packName) {
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
    logger.debug("Finding folder", {
      folders: this.compendium.folders,
      parentId,
    });
    const existingFolder = this.compendium.folders.find((f) =>
      f.name === name
      && flagTag === f.flags?.ddbimporter?.flagTag
      && (parentId === null
        || (parentId === f.folder?._id)
      )
    );
    if (existingFolder) return existingFolder;

    logger.debug("Creating folder", {
      folders: this.compendium.folders,
      parentId,
    });

    const newFolder = await Folder.create({
      _id: folderId,
      name,
      color,
      type: this.entityType,
      folder: parentId,
      flags: {
        ddbimporter: {
          flagTag,
        },
      }
    }, { pack: this.packName, keepId: true });

    return newFolder;
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

  async createClassFeatureFolders(includeOptions = true) {
    const classNames = CONFIG.DDB.classConfigurations
      .filter((c) => !c.name.includes("archived") && !c.name.includes("(UA)"))
      .map((c) => c.name);

    for (const className of classNames) {
      logger.debug(`Checking for class folder '${className}'`);
      const folder = this.getFolder(className)
        ?? (await this.createCompendiumFolder({ name: className }));
      this.validFolderIds.push(folder._id);
      this.classFolders[className] = folder;
      if (includeOptions) {
        const flagTag = `optional/${className}`;
        const optionalFolder = this.getFolder("Optional Features", flagTag)
          ?? (await this.createCompendiumFolder({ name: "Optional Features", parentId: folder._id, color: "#222222", flagTag }));
        this.validFolderIds.push(optionalFolder._id);
      }
    }
  }

  async createSubClassFeatureFolder(subclassName, parentClassName) {
    const flagTag = `subclass/${subclassName}`;
    logger.debug(`Checking for Subclass folder '${subclassName}' with Parent Class '${parentClassName}'`);

    const folder = this.getFolder(subclassName, flagTag)
      ?? (await this.createCompendiumFolder({
        name: subclassName,
        parentId: this.classFolders[parentClassName]._id,
        color: "#222222",
        flagTag,
      }));
    this.subClassFolders[subclassName] = folder;
    this.validFolderIds.push(folder._id);
  }

  async getRacialBaseFolder(type, baseRaceName) {
    const folderType = type.includes("trait") ? "traitFolders" : "raceFolders";
    const flagType = type.includes("trait") ? "trait" : "race";
    logger.debug(`Checking for race folder '${baseRaceName}'`);
    const existingFolder = this.getFolder(baseRaceName, `${flagType}/${baseRaceName}`);
    if (existingFolder) return existingFolder;
    logger.debug(`Not found, creating race folder '${baseRaceName}'`);
    const newFolder = await this.createCompendiumFolder({
      name: baseRaceName,
      flagTag: `${flagType}/${baseRaceName}`,
    });
    this.validFolderIds.push(newFolder._id);
    this[folderType][baseRaceName] = newFolder;
    return newFolder;
  }

  async createBaseRacialFolders(type) {
    const raceNames = CONFIG.DDB.raceGroups.map((c) => c.name);
    for (const raceName of raceNames) {
      await this.getRacialBaseFolder(type, raceName);
    }
  }

  async createSubTraitFolders(baseRaceName, fullRaceName) {
    const flagTag = `trait/${baseRaceName}/${fullRaceName}`;
    logger.debug(`Checking for Race folder '${fullRaceName}' with Base Race '${baseRaceName}'`);

    const parentFolder = await this.getRacialBaseFolder("trait", baseRaceName);

    const folder = this.getFolder(fullRaceName, flagTag)
      ?? (await this.createCompendiumFolder({
        name: fullRaceName,
        parentId: parentFolder._id,
        color: "#222222",
        flagTag,
      }));
    this.traitSubFolders[fullRaceName] = folder;
    this.validFolderIds.push(folder._id);
  }

  // eslint-disable-next-line complexity
  async createCompendiumFolders() {
    logger.debug(`Checking and creating Compendium folder structure for ${this.type}`);

    this.resetFolderLookups();

    switch (this.type) {
      case "race":
      case "races": {
        // we create these as needed
        // this.createBaseRacialFolders("race");
        break;
      }
      case "trait":
      case "traits": {
        // we create these as needed
        // this.createBaseRacialFolders("trait");
        break;
      }
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
      case "features": {
        await this.createClassFeatureFolders();
        break;
      }
      case "subclass":
      case "subclasses": {
        await this.createClassFeatureFolders(false);
        break;
      }
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

  // eslint-disable-next-line class-methods-use-this
  getClassFeatureFolderName(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };
    const subClassName = foundry.utils.getProperty(document, "flags.ddbimporter.subClass");
    const className = foundry.utils.getProperty(document, "flags.ddbimporter.class");
    const optional = foundry.utils.getProperty(document, "flags.ddbimporter.optionalFeature");
    if (optional) {
      result.name = "Optional Features";
      result.flagTag = `optional/${className}`;
    } else if (subClassName && subClassName.trim() !== "") {
      result.name = subClassName;
      result.flagTag = `subclass/${subClassName}`;
    } else if (className && className.trim() !== "") {
      result.name = className;
    } else {
      result.name = "Unknown";
    }

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
    const fullRaceName = foundry.utils.getProperty(document, "flags.ddbimporter.fullRaceName");
    // const name = document.name;
    // const lowercaseName = name.toLowerCase();

    const groupName = foundry.utils.getProperty(document, "flags.ddbimporter.groupName");

    result.name = fullRaceName;
    result.flagTag = `trait/${groupName}/${fullRaceName}`;

    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  getRaceFolderName(document) {
    const result = {
      name: undefined,
      flagTag: "",
    };

    const fullRaceName = foundry.utils.getProperty(document, "flags.ddbimporter.fullRaceName");
    const groupName = foundry.utils.getProperty(document, "flags.ddbimporter.groupName");
    result.name = groupName ?? fullRaceName;
    result.flagTag = `race/${(groupName ?? fullRaceName)}`;

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

  // eslint-disable-next-line complexity
  getCompendiumFolderName(document) {
    let name;
    switch (this.type) {
      case "trait":
      case "traits": {
        name = this.getRaceTraitFolderName(document);
        break;
      }
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
      case "subclass":
      case "subclasses": {
        name = this.getClassFolderName(document);
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
        name = this.getItemCompendiumFolderName(document);
      }
      // no default
    }
    return name;
  }

  getFolder(folderName, flagTag = "") {
    const folder = this.compendium.folders.find((f) =>
      f.name == folderName
      && f.flags?.ddbimporter?.flagTag === flagTag
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
      case "class":
      case "subclass":
      case "classes":
      case "subclasses":
      case "feature": {
        return [
          "name",
          "flags.ddbimporter.class",
          "flags.ddbimporter.subClass",
          "flags.ddbimporter.optionalFeature",
        ];
      }
      case "trait":
      case "traits":
      case "race":
      case "races": {
        return [
          "name",
          "flags.ddbimporter.baseRaceName",
          "flags.ddbimporter.baseName",
          "flags.ddbimporter.subRaceShortName",
          "flags.ddbimporter.isSubRace",
          "flags.ddbimporter.fullRaceName",
          "flags.ddbimporter.groupName"
        ];
      }
      default:
        return ["name"];
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
      case "trait":
      case "traits":
      case "race":
      case "races":
      case "features":
      case "feature":
      case "class":
      case "classes":
      case "subclass":
      case "subclasses":
      case "inventory":
      case "items":
      case "item":
      case "spells":
      case "spell": {
        await Item.updateDocuments(results, { pack: this.packName });
        break;
      }
      case "monsters":
      case "npc":
      case "monster": {
        await Actor.updateDocuments(results, { pack: this.packName });
        break;
      }
      // no default
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
