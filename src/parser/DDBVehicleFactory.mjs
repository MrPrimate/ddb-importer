import {
  logger,
  FileHelper,
  DDBItemImporter,
  Secrets,
  DDBProxy,
  PatreonHelper,
  DDBCompendiumFolders,
  DDBSources,
  Iconizer,
  DDBCampaigns,
} from "../lib/_module.mjs";
import { SETTINGS } from "../config/_module.mjs";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import DDBMonsterImporter from "../muncher/DDBMonsterImporter.mjs";
import { DDBReferenceLinker } from "./lib/_module.mjs";
import DDBVehicle from "./DDBVehicle.js";


export default class DDBVehicleFactory {

  constructor ({
    ddbData = null, extra = false, notifier = null, forceUpdate = null,
    useLocalKey = null, keyPostfix = null,
  } = {}) {
    this.extra = extra;
    this.keys = {
      useLocal: useLocalKey,
      keyPostfix,
    };
    this.vehicles = [];
    this.source = ddbData;
    this.notifier = notifier ?? DDBVehicleFactory.#noteStub;
    this.type = "vehicles";
    this.compendiumFolders = new DDBCompendiumFolders("vehicles");
    this.update = forceUpdate ?? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
    this.updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
    this.uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

    this.addMonsterEffects = game.settings.get("ddb-importer", "munching-policy-add-monster-midi-effects");
    this.addChrisPremades = game.settings.get("ddb-importer", "munching-policy-use-chris-premades");

    this.currentDocument = 1;
    this.totalDocuments = 0;
    this.vehiclesParsed = [];
  }

  static #noteStub(note, { nameField = false, monsterNote = false } = {}) {
    logger.info(note, { nameField, monsterNote });
  }

  static defaultFetchOptions(ids, searchTerm = null) {
    const searchFilter = $("#monster-munch-filter")[0];
    const finalSearchTerm = searchTerm ?? (searchFilter?.value ?? "");
    const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
    const sources = enableSources
      ? DDBSources.getSelectedSourceIds()
      : [];
    const homebrew = false;
    const homebrewOnly = false;
    // vehicles do not have homebrew filtering yet
    // const homebrew = sources.length > 0
    //   ? false
    //   : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew");
    // const homebrewOnly = sources.length > 0
    //   ? false
    //   : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew-only");
    const exactMatch = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-exact-match");
    const excludedCategories = DDBSources.getAllExcludedCategoryIds();

    const options = {
      ids,
      searchTerm: finalSearchTerm.trim(),
      sources,
      homebrew,
      homebrewOnly,
      exactMatch,
      excludedCategories,
      excludeLegacy: false,
    };
    logger.debug("Generated vehicles fetch options", options);
    return options;
  }

  /**
   * Fetch vehicles from DDB
   * @param {object} options
   * @param {number[]|number} [options.ids] limit vehicles fetched to specific ids
   * @param {string} [options.searchTerm] search term for vehicles
   * @param {string[]} [options.sources] sources to search in
   * @param {boolean} [options.homebrew=false] include homebrew vehicles
   * @param {boolean} [options.homebrewOnly=false] only search homebrew vehicles
   * @param {boolean} [options.exactMatch=false] search for exact vehicle name
   * @param {boolean} [options.excludeLegacy=false] exclude legacy content
   * @param {number[]} [options.excludedCategories] excluded category IDs
   * @returns {Promise<object[]>} a promise that resolves with an array of vehicles
   */
  async fetchDDBVehicleSourceData({ ids = [], searchTerm = "", sources = [], homebrew = false,
    homebrewOnly = false, exactMatch = false, excludeLegacy = false, excludedCategories = [] } = {},
  ) {
    const keyPostfix = this.keys.keyPostfix ?? CONFIG.DDBI.keyPostfix ?? null;
    const useLocal = this.keys.useLocal ?? CONFIG.DDBI.useLocal ?? false;
    const cobaltCookie = Secrets.getCobalt(keyPostfix);
    const betaKey = PatreonHelper.getPatreonKey(useLocal);
    const parsingApi = DDBProxy.getProxy();
    const campaignId = DDBCampaigns.getCampaignId();

    const body = {
      cobalt: cobaltCookie,
      betaKey,
      campaignId,
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
      body.excludedCategories = excludedCategories;
    }

    const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

    const defaultUrl = ids && ids.length > 0
      ? `${parsingApi}/proxy/vehicles/ids`
      : `${parsingApi}/proxy/vehicles`;
    const url = CONFIG.DDBI.vehicleURL ?? defaultUrl;

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
        .then((result) => {
          if (!result.success) {
            this.notifier(`API Failure: ${result.message}`);
            logger.error(`API Failure:`, result.message);
            reject(result.message);
          }
          if (debugJson) {
            FileHelper.download(JSON.stringify(result), `vehicles-raw.json`, "application/json");
          }
          return result;
        })
        .then((result) => {
          this.notifier(`Retrieved ${result.data.length} vehicles from DDB`, { nameField: true, monsterNote: false });
          logger.info(`Retrieved ${result.data.length} vehicles from DDB`);
          return result.data;
        })
        .then((data) => {
          // handle category filtering
          if (ids && ids.length > 0) {
            this.source = data;
            resolve(this.source);
          } else {
            logger.debug("Processing categories", { data });
            const categoryVehicles = data
              .filter((vehicle) => vehicle.sources)
              .map((vehicle) => {
                vehicle.sources = vehicle.sources.filter((source) =>
                  source.sourceType === 1
                  && DDBSources.isSourceInAllowedCategory(source),
                );
                return vehicle;
              })
              .filter((vehicle) => {
                if (vehicle.isHomebrew) return true;
                return vehicle.sources.length > 0;
              });
            this.source = categoryVehicles;
            resolve(this.source);
          }
        })
        .catch((error) => reject(error));
    });
  }

  async #prepareImporter() {
    // to speed up file checking we pregenerate existing files now.
    await DDBReferenceLinker.importCacheLoad();
    logger.info("Checking for existing files...");
    this.notifier(`Checking existing image files...`);
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
   * Takes a list of vehicles and parses them into a format suitable for importing
   * into Foundry.
   * @param {object} opts
   * @param {Array} [opts.vehicles=[]] A list of vehicles to import
   * @param {number} [opts.i=0] The number of vehicles imported so far
   * @returns {Promise<Array>} A promise that resolves with an array of parsed
   * vehicle documents
   */
  async #createVehicleDocuments({ vehicles = [], i = 0 } = {}) {
    logger.time(`Vehicle Process Time ${i}`);

    const vehicleResults = await this.parse(vehicles);

    const vehicleHandler = new DDBItemImporter(this.type, vehicleResults.actors, {
      notifier: this.notifier,
      matchFlags: ["is2014", "is2024"],
    });
    await vehicleHandler.init();

    logger.debug("Item Importer Loaded");
    if (!this.update || !this.updateImages) {
      this.notifier(`Calculating which vehicles to update...`, { nameField: true });
      const existingVehicles = await vehicleHandler.loadPassedItemsFromCompendium(vehicleHandler.documents, "npc", {
        keepDDBId: true,
        indexFilter: { fields: ["name", "flags.ddbimporter.id"] },
      });
      const existingVehicleTotal = existingVehicles.length + 1;
      if (!this.update) {
        logger.debug("Removing existing vehicles from import list");
        logger.debug(`Matched ${existingVehicleTotal}`);
        this.notifier(`Removing ${existingVehicleTotal} from update...`);
        vehicleHandler.removeItems(existingVehicles, true);
      }
      if (!this.updateImages) {
        logger.debug("Copying vehicle images across...");
        this.notifier(`Copying images for ${existingVehicleTotal} vehicles...`);
        vehicleHandler.documents = DDBVehicleFactory.copyExistingVehicleImages(vehicleHandler.documents, existingVehicles);
      }
    }
    this.notifier("");
    await vehicleHandler.iconAdditions();
    this.notifier(`Generating Icon Map..`, { nameField: true });
    await vehicleHandler.generateIconMap();
    await vehicleHandler.useSRDMonsterImages();

    logger.timeEnd(`Vehicle Process Time ${i}`);
    logger.debug(`Vehicle Document Generation ${i}`, {
      itemHandler: vehicleHandler,
    });

    return vehicleHandler.documents;

  }

  async #loadIntoCompendiums(documents) {
    const startingCount = this.currentDocument;
    for (const doc of documents) {
      this.notifier(`[${this.currentDocument}/${documents.length + startingCount - 1} of ${this.totalDocuments}] Importing ${doc.name} to compendium`, { monsterNote: true });
      logger.debug(`Preparing ${doc.name} data for import`);
      const munched = await DDBMonsterImporter.addNPC(doc, "vehicle", {}, {
        fullWipe: true,
      });
      if (munched) this.vehiclesParsed.push(munched);
      this.currentDocument += 1;
    }
  }


  static copyExistingVehicleImages(vehicles, existingVehicles) {
    return DDBMonsterFactory.copyExistingMonsterImages(vehicles, existingVehicles);
  }

  /**
   * Downloads, parses and imports vehicles into a compendium
   * @param {Array} ids a list of vehicle ids to import, if null imports all vehicles
   * @param {string} searchTerm an optional search term
   * @returns {Promise<number|Array>} If ids is null, returns the total number of vehicles processed
   * If ids is not null, returns a Promise that resolves with an array of the parsed vehicle documents
   */
  async processIntoCompendium(ids = null, searchTerm = null) {

    logger.time("Vehicle Import Time");
    await this.#prepareImporter();

    logger.info("Check complete getting vehicle data...");
    this.notifier(`Getting vehicle data from DDB...`);
    await this.fetchDDBVehicleSourceData(DDBVehicleFactory.defaultFetchOptions(ids, searchTerm));
    this.notifier("");

    this.notifier(`Checking compendium folders..`, { nameField: true });
    await this.compendiumFolders.loadCompendium("vehicles", true);
    this.notifier("", { nameField: true });

    this.totalDocuments = this.source.length;

    for (let i = 0; i < this.source.length; i += 100) {
      const sourceDocuments = this.source.slice(i, i + 100);
      logger.debug(`Processing documents for ${i + 1} to ${i + 100}`, { sourceDocuments, this: this });
      const documents = await this.#createVehicleDocuments({ vehicles: this.source.slice(i, i + 100), i });
      const vehicleCount = this.currentDocument + documents.length - 1;
      this.notifier(`Preparing to service vehicles ${i + 1} to ${vehicleCount} of ${this.totalDocuments}!`, { nameField: true });
      await this.compendiumFolders.createVehicleFoldersForDocuments({ documents });
      this.notifier(`Preparing dinner for vehicles ${i + 1} to ${vehicleCount} of ${this.totalDocuments}!`, { nameField: true });
      await this.#loadIntoCompendiums(documents);
    }

    logger.debug("Vehicles Parsed", this.vehiclesParsed);
    this.notifier("", { monsterNote: true });

    logger.timeEnd("Vehicle Import Time");
    if (ids !== null) {
      return Promise.all(this.vehiclesParsed);
    }
    return this.vehiclesParsed.length;
  }

  /**
   * Parses the downloaded (or provided) DDB Source data for vehicles and generates actors
   * Use this.fetchDDBVehicleSourceData() if you need to get vehicle data from ddb
   * @param {object[]} [vehicles] Optional vehicle data to parse. If not provided, will use data from fetchDDBVehicleSourceData()
   * @returns {object} Object with two properties: actors (an array of parsed actor documents) and failedVehicleNames (an array of names of vehicles that failed to parse)
   */
  async parse(vehicles = []) {
    let foundryActors = [];
    let failedVehicleNames = [];

    const vehicleSource = vehicles.length > 0 ? vehicles : this.source;

    const totalVehicles = this.source.length;
    let i = this.currentDocument;
    logger.time("Vehicle Parsing");
    for (const vehicle of vehicleSource) {
      const name = `${vehicle.name}${vehicle.isLegacy ? " legacy" : ""}`;
      try {
        this.notifier(`[${i}/${this.currentDocument + vehicleSource.length - 1} of ${totalVehicles}] Parsing data for guest ${name}`, { nameField: false, monsterNote: true });
        i++;
        logger.debug(`Attempting to parse ${i}/${totalVehicles} ${vehicle.name}`);
        logger.time(`Vehicle Parse ${name}`);
        const ddbVehicle = new DDBVehicle({
          ddbVehicle: vehicle,
          extra: this.extra,
          legacyName: this.legacyName,
          addMonsterEffects: this.addMonsterEffects,
          addChrisPremades: this.addChrisPremades,
        });
        await ddbVehicle.parse();
        foundryActors.push(foundry.utils.duplicate(ddbVehicle.data));
        logger.timeEnd(`Vehicle Parse ${name}`);
      } catch (err) {
        logger.error(`Failed parsing ${name}`);
        logger.error(err);
        logger.error(err.stack);
        failedVehicleNames.push(name);
      }
    }

    const result = {
      actors: await Promise.all(foundryActors),
      failedVehicleNames,
    };

    logger.timeEnd("Vehicle Parsing");

    this.notifier(
      `Parsed ${result.actors.length} vehicles, failed ${result.failedVehicleNames.length} vehicles`,
      { nameField: false, monsterNote: true },
    );
    logger.info(`Parsed ${result.actors.length} vehicles, failed ${result.failedVehicleNames.length} vehicles`);
    if (result.failedVehicleNames && result.failedVehicleNames.length !== 0) {
      logger.error(`Failed to parse`, result.failedVehicleNames);
    }

    this.vehicles.push(...result.actors);
    return result;
  }

}
