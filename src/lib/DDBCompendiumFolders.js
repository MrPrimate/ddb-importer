/* eslint-disable no-await-in-loop */
import DICTIONARY from "../dictionary.js";
import logger from "../logger.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import utils from "./utils.js";
import { addToCompendiumFolder, createCompendiumFolderStructure, migrateExistingCompendium } from "../muncher/compendiumFolders.js";


// const compendiumFoldersInstalled = game.modules.get("compendium-folders")?.active;
// const useV10Folders = isNewerVersion(11, game.version);

// if (useV10Folders && !compendiumFoldersInstalled) {
//   logger.warn("Compendium Folders module is not installed");
//   return new Promise((resolve) => {
//     resolve(false);
//   });
// }

export class DDBCompendiumFolders {
  resetFolderLookups() {
    this.rootItemFolders = {};
    this.equipmentFolders = {};
    this.weaponFolders = {};
    this.trinketFolders = {};
    this.consumableFolders = {};
    this.lootFolders = {};
    this.toolFolders = {};
    this.backpackFolders = {};
  }

  constructor(type, packName) {
    this.isV10 = isNewerVersion(11, game.version);
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

  async loadCompendium(type = null) {
    if (type) {
      this.packName = await CompendiumHelper.getCompendiumLabel(type);
      this.entityType = this.entityTypes.get(type);
    }
    this.compendium = CompendiumHelper.getCompendium(this.packName);
  }

  async createCompendiumFolder({ name, parentId = null, color = "#6f0006", folderId = null } = {}) {
    const existingFolder = this.compendium.folders.find((f) =>
      f.name === name
      && (parentId === null
        || (parentId === f.folder?._id)
      )
    );
    if (existingFolder) return existingFolder;

    const newFolder = await Folder.create({
      _id: folderId,
      name,
      color,
      type: this.entityType,
      folder: parentId,
    }, { pack: this.packName, keepId: true });

    return newFolder;
  }

  async createCreatureTypeCompendiumFolders() {
    return new Promise((resolve) => {
      let promises = [];
      for (const monsterType of CONFIG.DDB.monsterTypes) {
        promises.push(this.createCompendiumFolder({ name: monsterType.name, color: "#6f0006" }));
      }
      resolve(Promise.all(promises));
    });
  }

  async createAlphabeticalCompendiumFolders() {
    return new Promise((resolve) => {
      let promises = [];
      for (let i = 9; ++i < 36;) {
        const folderName = i.toString(36).toUpperCase();
        promises.push(this.createCompendiumFolder({ name: folderName, color: "#6f0006" }));
      }
      resolve(Promise.all(promises));
    });
  }

  async createChallengeRatingCompendiumFolders() {
    return new Promise((resolve) => {
      let promises = [];
      CONFIG.DDB.challengeRatings.forEach((cr) => {
        const paddedCR = String(cr.value).padStart(2, "0");
        promises.push(this.createCompendiumFolder({ name: `CR ${paddedCR}`, color: "#6f0006" }));
      });
      resolve(Promise.all(promises));
    });
  }

  // spell level
  async createSpellLevelCompendiumFolders() {
    return new Promise((resolve) => {
      let promises = [];
      DICTIONARY.COMPENDIUM_FOLDERS.SPELL_LEVEL.forEach((levelName) => {
        logger.info(`Creating folder '${levelName}'`);
        promises.push(this.createCompendiumFolder({ name: levelName }));
      });
      resolve(Promise.all(promises));
    });
  }

  // spell school
  async createSpellSchoolCompendiumFolders() {
    return new Promise((resolve) => {
      let promises = [];
      DICTIONARY.spell.schools.forEach((school) => {
        const schoolName = utils.capitalize(school.name);
        logger.info(`Creating folder '${schoolName}'`);
        promises.push(this.createCompendiumFolder({ name: schoolName }));
      });
      resolve(Promise.all(promises));
    });
  }

  // item rarity folder
  async createItemRarityCompendiumFolders() {
    return new Promise((resolve) => {
      let promises = [];
      DICTIONARY.COMPENDIUM_FOLDERS.RARITY.forEach((rarityName) => {
        logger.info(`Creating folder '${rarityName}'`);
        promises.push(this.createCompendiumFolder({ name: rarityName }));
      });
      resolve(promises);
    });
  }

  // item type folder
  async createItemTypeCompendiumFolders() {
    let promises = [];

    for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.ITEM_ROOT)) {
      logger.info(`Creating root folder '${value}' with key '${key}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: value });
      this.rootItemFolders[key] = folder;
      promises.push(folder);
    }

    for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.EQUIPMENT)) {
      logger.info(`Creating Equipment folder '${value}' with key '${key}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: value, parentId: this.rootItemFolders["equipment"], color: "#222222" });
      this.equipmentFolders[key] = folder;
      promises.push(folder);
    }

    for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.WEAPON)) {
      logger.info(`Creating Weapon folder '${value}' with key '${key}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: value, parentId: this.rootItemFolders["weapon"], color: "#222222" });
      this.weaponFolders[key] = folder;
      promises.push(folder);
    }

    for (const [key, value] of Object.entries(DICTIONARY.COMPENDIUM_FOLDERS.TOOLS)) {
      logger.info(`Creating Tool folder '${value}' with key '${key}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: value, parentId: this.rootItemFolders["tool"], color: "#222222" });
      this.toolFolders[key] = folder;
      promises.push(folder);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.TRINKET) {
      logger.info(`Creating Equipment\\Trinket folder '${folderName}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: folderName, parentId: this.equipmentFolders["trinket"], color: "#444444" });
      this.trinketFolders[folderName] = folder;
      promises.push(folder);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.CONSUMABLE) {
      logger.info(`Creating Consumable folder '${folderName}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["consumable"], color: "#222222" });
      this.consumableFolders[folderName] = folder;
      promises.push(folder);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.LOOT) {
      logger.info(`Creating Loot folder '${folderName}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["loot"], color: "#222222" });
      this.lootFolders[folderName] = folder;
      promises.push(folder);
    }

    for (const folderName of DICTIONARY.COMPENDIUM_FOLDERS.BACKPACK) {
      logger.info(`Creating Backpack folder '${folderName}'`);
      // eslint-disable-next-line no-await-in-loop
      const folder = await this.createCompendiumFolder({ name: folderName, parentId: this.rootItemFolders["backpack"], color: "#222222" });
      this.backpackFolders[folderName] = folder;
      promises.push(folder);
    }

    return new Promise((resolve) => {
      resolve(promises);
    });
  }


  async createCompendiumFolders() {
    if (this.isV10) {
      return createCompendiumFolderStructure(this.type);
    }
    logger.debug(`Creating Compendium folder structure for ${this.type}`);

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
        this.resetFolderLookups();
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
    return name;
  }

  getItemCompendiumFolderNameForType(document) {
    let name;

    switch (document.type) {
      case "equipment": {
        switch (document.system?.armor?.type) {
          case "trinket": {
            const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
            if (ddbType) {
              name = this.trinketFolders[ddbType].name;
            }
            break;
          }
          default: {
            name = this.equipmentFolders[document.system.armor.type].name;
            break;
          }
        }
        break;
      }
      case "weapon": {
        name = this.weaponFolders[document.system.weaponType].name;
        break;
      }
      case "consumable": {
        const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
        if (ddbType) {
          name = this.consumableFolders[ddbType].name;
        }
        break;
      }
      case "loot": {
        const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
        if (ddbType) {
          name = this.lootFolders[ddbType].name;
        }
        break;
      }
      case "backpack": {
        const ddbType = document.flags?.ddbimporter?.dndbeyond?.type;
        if (ddbType) {
          name = this.backpackFolders[ddbType].name;
        }
        break;
      }
      case "tool": {
        const toolType = document.system.toolType;
        const instrument = document.flags?.ddbimporter?.dndbeyond?.tags.includes("Instrument");
        const ddbType = ["art", "music", "game"].includes(toolType);
        if (instrument) {
          name = this.toolFolders["music"].name;
        } else if (ddbType) {
          name = this.toolFolders[toolType].name;
        } else {
          name = this.rootItemFolders[document.type].name;
        }
        break;
      }
      default: {
        name = this.rootItemFolders[document.type].name;
        break;
      }
    }

    return name;
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

  getCompendiumFolderName(document) {
    let name;
    switch (this.type) {
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

  async getFolderId(document) {
    switch (this.type) {
      case "inventory":
      case "items":
      case "item":
      case "spells":
      case "spell":
      case "monsters":
      case "npc":
      case "monster": {
        const folderName = this.getCompendiumFolderName(document);
        if (folderName) {
          const folder = this.compendium.folders.find((f) => f.name == folderName);
          if (folder) return folder._id;
        }
        break;
      }
      // no default
    }
    return undefined;
  }

  async addToCompendiumFolder(document) {
    if (this.isV10) {
      await addToCompendiumFolder(this.type, document);
      return;
    }
    logger.debug(`Checking ${document.name} in ${this.packName}`);

    switch (this.type) {
      case "inventory":
      case "items":
      case "item":
      case "spells":
      case "spell":
      case "monsters":
      case "npc":
      case "monster": {
        const folderName = this.getCompendiumFolderName(document);
        if (folderName) {
          const folder = this.compendium.folders.find((f) => f.name == folderName);
          if (folder) {
            logger.info(`Moving ${this.type} ${document.name} to folder ${folder.name}`);
            await document.update({ folder: folder._id });
          } else {
            logger.error(`Unable to find folder "${folderName}" in "${this.packName}" for ${this.type}`);
          }
        }
      }
      // no default
    }

  }

  async migrateExistingCompendium() {
    if (this.isV10) {
      return migrateExistingCompendium(this.type);
    }
    if (!this.compendium) return undefined;
    await this.createCompendiumFolders();

    logger.debug("Compendium Folders", this.compendium.folders);

    let indexFields = ["name"];
    switch (this.type) {
      case "spells":
      case "spell": {
        indexFields = ["name", "data.level"];
        break;
      }
      case "inventory":
      case "items":
      case "item": {
        indexFields = [
          "name",
          "type",
          "flags.ddbimporter.dndbeyond.type",
          "data.armor.type",
          "data.weaponType",
          "data.rarity"
        ];
        break;
      }
      // no default
    }

    const index = await this.compendium.getIndex({ fields: indexFields });

    switch (this.type) {
      case "inventory":
      case "items":
      case "item":
      case "spells":
      case "spell":
      case "monsters":
      case "npc":
      case "monster": {
        // loop through all existing monsters and move them to their type
        for (const i of index) {
          const existing = await this.compendium.getDocument(i._id);
          await this.addToCompendiumFolder(existing);
        }
        break;
      }
      // no default
    }

    return this.compendium.folders;
  }
}
