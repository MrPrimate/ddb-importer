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
  useSRDMonsterImages,
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

  constructor ({ ddbData = null, extra = false, munchNote = null, type = "monsters", forceUpdate = null } = {}) {
    this.extra = extra;
    this.npcs = [];
    this.source = ddbData;
    this.munchNote = munchNote ?? DDBMonsterFactory.#noteStub;
    this.type = type;
    this.compendiumFolders = new DDBCompendiumFolders(type);
    this.update = forceUpdate ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
    this.updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
    this.uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

    this.useItemAC = game.settings.get("ddb-importer", "munching-policy-monster-use-item-ac");
    this.legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    this.addMonsterEffects = game.settings.get("ddb-importer", "munching-policy-add-monster-effects");
    this.addChrisPremades = game.settings.get("ddb-importer", "munching-policy-use-chris-premades");


    this.currentDocument = 1;
    this.totalDocuments = 0;
    this.monstersParsed = [];
  }

  /**
   * Fetch monsters from DDB
   * @param {*} ids limit monsters fetched to specific ids
   * @returns
   */
  async fetchDDBMonsterSourceData({ ids = [], searchTerm = "", sources = [], homebrew = false,
    homebrewOnly = false, exactMatch = false, excludeLegacy = false },
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
          this.munchNote(`Retrieved ${data.data.length + 1} monsters from DDB`, true, false);
          logger.info(`Retrieved ${data.data.length + 1} monsters from DDB`);
          this.source = data.data;
          resolve(this.source);
        })
        .catch((error) => reject(error));
    });
  }

  /**
   * Parses the downloaded (or provided) DDB Source data for monsters and generates actors
   * Use this.fetchDDBMonsterSourceData() if you need to get monster data from ddb
   * @param {object[]} [monsters] Optional monster data to parse. If not provided, will use data from fetchDDBMonsterSourceData()
   * @returns {object} Object with two properties: actors (an array of parsed actor documents) and failedMonsterNames (an array of names of monsters that failed to parse)
   */
  async parse(monsters = []) {
    let foundryActors = [];
    let failedMonsterNames = [];

    const monsterSource = monsters.length > 0 ? monsters : this.source;

    const totalMonsters = this.source.length + 1;
    let i = this.currentDocument;
    logger.time("Monster Parsing");
    for (const monster of monsterSource) {
      const name = `${monster.name}${monster.isLegacy ? " legacy" : ""}`;
      try {
        this.munchNote(`[${i}/${this.currentDocument + monsterSource.length - 1} of ${totalMonsters}] Parsing Foundry Actor for ${name}`, false, true);
        i++;
        logger.debug(`Attempting to parse ${i}/${totalMonsters} ${monster.name}`);
        logger.time(`Monster Parse ${name}`);
        const ddbMonster = new DDBMonster(monster, {
          extra: this.extra,
          useItemAC: this.useItemAC,
          legacyName: this.legacyName,
          addMonsterEffects: this.addMonsterEffects,
          addChrisPremades: this.addChrisPremades,
        });
        await ddbMonster.parse();
        foundryActors.push(foundry.utils.duplicate(ddbMonster.npc));
        logger.timeEnd(`Monster Parse ${name}`);
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
      true,
    );
    logger.info(`Parsed ${result.actors.length} monsters, failed ${result.failedMonsterNames.length} monsters`);
    if (result.failedMonsterNames && result.failedMonsterNames.length !== 0) {
      logger.error(`Failed to parse`, result.failedMonsterNames);
    }

    this.npcs.push(...result.actors);
    return result;
  }

  async #prepareImporter() {
    // to speed up file checking we pregenerate existing files now.
    logger.info("Checking for existing files...");
    this.munchNote(`Checking existing image files...`);
    CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.clear();
    CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.clear();
    await Iconizer.preFetchDDBIconImages();
    await FileHelper.generateCurrentFiles(this.uploadDirectory);
    await FileHelper.generateCurrentFiles("[data] modules/ddb-importer/data");

    if (game.canvas3D?.CONFIG?.UI) {
      // generate 3d model cache
      await game.canvas3D.CONFIG.UI.TokenBrowser.preloadData();
    }
  }

  /**
   * Downloads, parses, prepares
   * Takes a list of monsters and parses them into a format suitable for importing
   * into Foundry.
   * @param {object} opts
   * @param {Array} [opts.monsters=[]] A list of monsters to import
   * @param {number} [opts.i=0] The number of monsters imported so far
   * @returns {Promise<Array>} A promise that resolves with an array of parsed
   * monster documents
   */
  async #createMonsterDocuments({ monsters = [], i = 0 } = {}) {
    logger.time(`Monster Process Time ${i}`);

    const monsterResults = await this.parse(monsters);

    const itemHandler = new DDBItemImporter(this.type, monsterResults.actors);
    await itemHandler.init();

    logger.debug("Item Importer Loaded");
    if (!this.update || !this.updateImages) {
      this.munchNote(`Calculating which monsters to update...`, true);
      const existingMonsters = await itemHandler.loadPassedItemsFromCompendium(itemHandler.documents, "npc", { keepDDBId: true });
      const existingMonstersTotal = existingMonsters.length + 1;
      if (!this.update) {
        logger.debug("Removing existing monsters from import list");
        logger.debug(`Matched ${existingMonstersTotal}`);
        this.munchNote(`Removing ${existingMonstersTotal} from update...`);
        itemHandler.removeItems(existingMonsters, true);
      }
      if (!this.updateImages) {
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

    logger.timeEnd(`Monster Process Time ${i}`);
    logger.debug(`Monster Document Generation ${i}`, {
      itemHandler,
    });

    return itemHandler.documents;

  }

  async #loadIntoCompendiums(documents) {
    const startingCount = this.currentDocument;
    for (const monster of documents) {
      this.munchNote(`[${this.currentDocument}/${documents.length + startingCount - 1} of ${this.totalDocuments}] Importing ${monster.name} to compendium`, false, true);
      logger.debug(`Preparing ${monster.name} data for import`);
      const munched = await addNPC(monster, "monster");
      this.monstersParsed.push(munched);
      this.currentDocument += 1;
    }
  }

  /**
   * Downloads, parses and imports monsters into a compendium
   * @param {Array} ids - a list of monster ids to import, if null imports all monsters
   * @returns {Promise<number|Array>} If ids is null, returns the total number of monsters processed
   * If ids is not null, returns a Promise that resolves with an array of the parsed monster documents
   */
  async processIntoCompendium(ids = null) {

    logger.time("Monster Import Time");
    await this.#prepareImporter();

    logger.info("Check complete getting monster data...");
    this.munchNote(`Getting monster data from DDB...`);
    await this.fetchDDBMonsterSourceData(DDBMonsterFactory.defaultFetchOptions(ids));
    this.munchNote("");

    this.munchNote(`Checking compendium folders..`, true);
    await this.compendiumFolders.loadCompendium("monsters");
    this.munchNote("", true);

    this.totalDocuments = this.source.length;

    for (let i = 0; i < this.source.length; i += 100) {
      const sourceDocuments = this.source.slice(i, i + 100);
      logger.debug(`Processing documents for ${i + 1} to ${i + 100}`, { sourceDocuments, this: this });
      const documents = await this.#createMonsterDocuments({ monsters: this.source.slice(i, i + 100), i });
      const monsterCount = this.currentDocument + documents.length;
      this.munchNote(`Preparing dinner for monsters ${i + 1} to ${monsterCount} of ${this.totalDocuments}!`, true);
      await this.#loadIntoCompendiums(documents);
    }

    logger.debug("Monsters Parsed", this.monstersParsed);
    this.munchNote("", false, true);

    logger.timeEnd("Monster Import Time");
    if (ids !== null) {
      return Promise.all(this.monstersParsed);
    }
    return this.totalDocuments;
  }
}
