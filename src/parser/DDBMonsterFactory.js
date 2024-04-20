import logger from "../logger.js";
import DDBMonster from "./DDBMonster.js";
import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBProxy from "../lib/DDBProxy.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import SETTINGS from "../settings.js";
import { DDBCompendiumFolders } from "../lib/DDBCompendiumFolders.js";

// targets for migration
import {
  addNPC,
  generateIconMap,
  copyExistingMonsterImages,
  useSRDMonsterImages
} from "../muncher/importMonster.js";
import Iconizer from "../lib/Iconizer.js";
import DDBItemImporter from "../lib/DDBItemImporter.js";

export default class DDBMonsterFactory {

  static #noteStub(note, nameField = false, monsterNote = false) {
    logger.info(note, { nameField, monsterNote });
  }

  static defaultFetchOptions(ids, searchTerm = null) {
    const searchFilter = $("#monster-munch-filter")[0];
    const finalSearchTerm = searchTerm ?? (searchFilter?.value ?? "");
    const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
    const sources = enableSources
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-sources").flat()
      : [];
    const homebrew = sources.length > 0
      ? false
      : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew");
    const homebrewOnly = sources.length > 0
      ? false
      : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew-only");
    const exactMatch = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-exact-match");
    const excludeLegacy = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-exclude-legacy");

    const options = {
      ids,
      searchTerm: finalSearchTerm.trim(),
      sources,
      homebrew,
      homebrewOnly,
      exactMatch,
      excludeLegacy,
    };
    logger.debug("Generated monster fetch options", options);
    return options;
  }

  constructor ({ ddbData = null, extra = false, munchNote = null } = {}) {
    this.extra = extra;
    this.npcs = [];
    this.source = ddbData;
    this.munchNote = munchNote ?? DDBMonsterFactory.#noteStub;
    this.compendiumFolders = new DDBCompendiumFolders("monsters");
  }

  /**
   * Fetch monsters from DDB
   * @param {*} ids limit monsters fetched to specific ids
   * @returns
   */
  async fetchDDBMonsterSourceData({ ids = [], searchTerm = "", sources = [], homebrew = false,
    homebrewOnly = false, exactMatch = false, excludeLegacy = false }
  ) {
    const cobaltCookie = getCobalt();
    const betaKey = PatreonHelper.getPatreonKey();
    const parsingApi = DDBProxy.getProxy();

    const body = {
      cobalt: cobaltCookie,
      betaKey: betaKey,
    };

    if (ids && !Array.isArray(ids)) {
      ids = [ids];
    }

    if (ids && ids.length > 0) {
      body.ids = [...new Set(ids)];
    } else {
      body.sources = sources;
      body.search = searchTerm;
      body.homebrew = homebrew;
      body.homebrewOnly = homebrewOnly;
      body.searchTerm = encodeURIComponent(searchTerm);
      body.exactMatch = exactMatch;
      body.excludeLegacy = excludeLegacy;
    }

    const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

    const url = ids && ids.length > 0
      ? `${parsingApi}/proxy/monsters/ids`
      : `${parsingApi}/proxy/monster`;

    return new Promise((resolve, reject) => {
      fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success) {
            this.munchNote(`API Failure: ${data.message}`);
            logger.error(`API Failure:`, data.message);
            reject(data.message);
          }
          if (debugJson) {
            FileHelper.download(JSON.stringify(data), `monsters-raw.json`, "application/json");
          }
          return data;
        })
        .then((data) => {
          this.munchNote(`Retrieved ${data.data.length + 1} monsters, starting parse...`, true, false);
          logger.info(`Retrieved ${data.data.length + 1} monsters`);
          this.source = data.data;
          resolve(this.source);
        })
        .catch((error) => reject(error));
    });
  }

  /**
   * Processes the downloaded (or provided) DDB Source data for monsters and generates actors
   * Use this.fetchDDBMonsterSourceData() if you need to get monster data from ddb
   * @returns
   */
  async parse() {
    let foundryActors = [];
    let failedMonsterNames = [];

    const useItemAC = game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    const addMonsterEffects = game.settings.get("ddb-importer", "munching-policy-add-monster-effects");
    const addChrisPremades = game.settings.get("ddb-importer", "munching-policy-use-chris-premades");

    const totalMonsters = this.source.length + 1;
    let i = 1;
    logger.time("Monster Parsing");
    for (const monster of this.source) {
      const name = `${monster.name}${monster.isLegacy ? " legacy" : ""}`;
      try {
        this.munchNote(`Parsing ${i}/${totalMonsters} (${name})`, false, true);
        i++;
        logger.debug(`Attempting to parse ${i}/${totalMonsters} ${monster.name}`);
        logger.time(`Monster Parse ${name}`);
        const ddbMonster = new DDBMonster(monster, { extra: this.extra, useItemAC, legacyName, addMonsterEffects, addChrisPremades });
        // eslint-disable-next-line no-await-in-loop
        await ddbMonster.parse();
        foundryActors.push(foundry.utils.duplicate(ddbMonster.npc));
        logger.timeEnd(`Monster Parse ${name}`);
        // logger.timeLog("Monster Parsing", monster.name);
      } catch (err) {
        logger.error(`Failed parsing ${name}`);
        logger.error(err);
        logger.error(err.stack);
        failedMonsterNames.push(name);
      }
    }

    const result = {
      actors: await Promise.all(foundryActors),
      failedMonsterNames: failedMonsterNames,
    };

    logger.timeEnd("Monster Parsing");

    this.munchNote(
      `Parsed ${result.actors.length} monsters, failed ${result.failedMonsterNames.length} monsters`,
      false,
      true
    );
    logger.info(`Parsed ${result.actors.length} monsters, failed ${result.failedMonsterNames.length} monsters`);
    if (result.failedMonsterNames && result.failedMonsterNames.length !== 0) {
      logger.error(`Failed to parse`, result.failedMonsterNames);
    }

    this.npcs = result.actors;
    return result;
  }

  /**
   * Downloads, parces and imports monsters into a compendium
   */
  async processIntoCompendium(ids = null) {
    logger.time("Monster Import Time");
    foundry.utils.setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});
    const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
    const updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
    const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

    // to speed up file checking we pregenerate existing files now.
    logger.info("Checking for existing files...");
    this.munchNote(`Checking existing image files...`);
    CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.clear();
    CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.clear();
    await Iconizer.preFetchDDBIconImages();
    await FileHelper.generateCurrentFiles(uploadDirectory);
    await FileHelper.generateCurrentFiles("[data] modules/ddb-importer/data");

    if (game.canvas3D?.CONFIG?.UI) {
      // generate 3d model cache
      await game.canvas3D.CONFIG.UI.TokenBrowser.preloadData();
    }

    logger.info("Check complete getting monster data...");
    this.munchNote(`Getting monster data from DDB...`);
    await this.fetchDDBMonsterSourceData(DDBMonsterFactory.defaultFetchOptions(ids));
    this.munchNote("");
    const monsterResults = await this.parse();

    const itemHandler = new DDBItemImporter("monsters", monsterResults.actors);
    await itemHandler.init();

    logger.debug("Item Importer Loaded");
    if (!updateBool || !updateImages) {
      this.munchNote(`Calculating which monsters to update...`, true);
      const existingMonsters = await itemHandler.loadPassedItemsFromCompendium(itemHandler.documents, "npc", { keepDDBId: true });
      const existingMonstersTotal = existingMonsters.length + 1;
      if (!updateBool) {
        logger.debug("Removing existing monsters from import list");
        logger.debug(`Matched ${existingMonstersTotal}`);
        this.munchNote(`Removing ${existingMonstersTotal} from update...`);
        itemHandler.removeItems(existingMonsters, true);
      }
      if (!updateImages) {
        logger.debug("Copying monster images across...");
        this.munchNote(`Copying images for ${existingMonstersTotal} monsters...`);
        itemHandler.documents = copyExistingMonsterImages(itemHandler.documents, existingMonsters);
      }
    }
    this.munchNote("");
    this.munchNote(`Fiddling with the SRD data...`, true);
    await itemHandler.srdFiddling();
    await itemHandler.iconAdditions();
    this.munchNote(`Generating Icon Map..`, true);
    await generateIconMap(itemHandler.documents);
    await useSRDMonsterImages(itemHandler.documents);

    const addToCompendiumFolder = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-compendium-folders");
    if (addToCompendiumFolder) {
      this.munchNote(`Checking compendium folders..`, true);
      await this.compendiumFolders.loadCompendium("monsters");
      this.munchNote("", true);
    }

    let monstersParsed = [];
    let currentMonster = 1;
    const monsterCount = itemHandler.documents.length;
    this.munchNote(`Preparing dinner for ${monsterCount} monsters!`, true);
    for (const monster of itemHandler.documents) {
      this.munchNote(`[${currentMonster}/${monsterCount}] Importing ${monster.name} to compendium`, false, true);
      logger.debug(`Preparing ${monster.name} data for import`);
      // eslint-disable-next-line no-await-in-loop
      const munched = await addNPC(monster, "monster");
      monstersParsed.push(munched);
      currentMonster += 1;
    }
    logger.debug("Monsters Parsed", monstersParsed);
    this.munchNote("", false, true);
    foundry.utils.setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});

    logger.timeEnd("Monster Import Time");
    if (ids !== null) {
      return Promise.all(monstersParsed);
    }
    return monsterCount;
  }
}
