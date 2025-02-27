import {
  logger,
  FileHelper,
  DDBItemImporter,
  Secrets,
  DDBCampaigns,
  DDBProxy,
  PatreonHelper,
  DDBCompendiumFolders,
  utils,
  DDBSources,
} from "../lib/_module.mjs";
import { parseVehicles } from "../parser/vehicle/vehicle.js";
import { SETTINGS } from "../config/_module.mjs";
import { createDDBCompendium } from "../hooks/ready/checkCompendiums.js";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import DDBMonsterImporter from "./DDBMonsterImporter.mjs";

/**
 * Get the JSON data for vehicles from DDB
 * @param {Array<string>} [ids] The ids of the vehicles to fetch. If not provided, all vehicles will be fetched
 * @returns {Promise<Array<JSON>>} A promise that resolves to an array of JSON vehicle data
 */
export function getVehicleData(ids) {
  const cobaltCookie = Secrets.getCobalt();
  const betaKey = PatreonHelper.getPatreonKey();
  const parsingApi = DDBProxy.getProxy();

  const campaignId = DDBCampaigns.getCampaignId(utils.munchNote);
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };

  if (ids && ids.length > 0) {
    body.ids = [...new Set(ids)];
  } else {
    const searchFilter = $("#monster-munch-filter")[0];
    const searchTerm = searchFilter?.value || "";
    const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
    const sources = enableSources
      ? DDBSources.getSelectedSourceIds()
      : [];
    body.sources = sources;
    body.search = searchTerm;
    body.homebrew = body.sources.length > 0 ? false : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew");
    body.homebrewOnly = body.sources.length > 0 ? false : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew-only");
    body.searchTerm = encodeURIComponent(searchTerm);
    body.exactMatch = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-exact-match");
    body.excludeLegacy = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-exclude-legacy");
  }

  const url = ids && ids.length > 0
    ? `${parsingApi}/proxy/vehicles/ids`
    : `${parsingApi}/proxy/vehicles`;

  const debugJson = game.settings.get(SETTINGS.MODULE_ID, "debug-json");

  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `vehicles-raw.json`, "application/json");
        }
        if (!data.success) {
          utils.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => reject(error));
  });
}

/**
 * Processes vehicle data retrieved from DDB and parses it into Foundry-compatible actors.
 *
 * @param {Array} ddbData Array of vehicle data objects from DDB.
 * @returns {Array} An array of parsed vehicle actors ready for use in Foundry.
 */
async function processVehicleData(ddbData) {
  utils.munchNote(`Retrieved ${ddbData.length} vehicles, starting parse...`, true, false);
  logger.info(`Retrieved ${ddbData.length} vehicles`);
  const parsedVehicles = await parseVehicles(ddbData);

  utils.munchNote(
    `Parsed ${parsedVehicles.actors.length} vehicles, failed ${parsedVehicles.failedVehicleNames.length} vehicles`,
    false,
    true,
  );
  logger.info(`Parsed ${parsedVehicles.actors.length} vehicles, failed ${parsedVehicles.failedVehicleNames.length} vehicles`);
  if (parsedVehicles.failedVehicleNames && parsedVehicles.failedVehicleNames.length !== 0) {
    logger.error(`Failed to parse`, parsedVehicles.failedVehicleNames);
  }
  return parsedVehicles.actors;
}


export async function parseTransports(ids = null) {
  const compData = SETTINGS.COMPENDIUMS.find((c) => c.title === "Vehicles");
  await createDDBCompendium(compData);

  foundry.utils.setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  logger.info("Checking for existing files...");
  utils.munchNote(`Checking existing image files...`);
  await FileHelper.generateCurrentFiles(uploadDirectory);
  logger.info("Check complete getting vehicle data...");
  utils.munchNote(`Getting vehicle data from DDB...`);
  let vehicleJSON = await getVehicleData(ids);
  let vehicles = await processVehicleData(vehicleJSON);

  const vehicleHandler = new DDBItemImporter("vehicles", vehicles, {
    matchFlags: ["is2014", "is2024"],
    notifier: utils.munchNote,
  });
  await vehicleHandler.init();

  if (!updateBool || !updateImages) {
    utils.munchNote(`Calculating which vehicles to update...`, true);
    const existingVehicles = await DDBItemImporter.getCompendiumItems(vehicles, "vehicles", { keepDDBId: true });
    const existingVehiclesTotal = existingVehicles.length + 1;
    if (!updateBool) {
      logger.debug("Removing existing vehicles from import list");
      logger.debug(`Matched ${existingVehiclesTotal}`);
      utils.munchNote(`Removing ${existingVehiclesTotal} from update...`);
      vehicleHandler.removeItems(existingVehicles);
    }
    if (!updateImages) {
      logger.debug("Copying vehicle images across...");
      utils.munchNote(`Copying images for ${existingVehiclesTotal} vehicles...`);
      vehicles = DDBMonsterFactory.copyExistingMonsterImages(vehicles, existingVehicles);
    }
  }
  utils.munchNote("");
  utils.munchNote(`Fiddling with the SRD data...`, true);
  await vehicleHandler.srdFiddling();
  await vehicleHandler.iconAdditions();

  utils.munchNote(`Generating Icon Map..`, true);
  await vehicleHandler.generateIconMap();

  // Compendium folders not yet in use for Vehicles
  const compendiumFolders = new DDBCompendiumFolders("vehicles");
  utils.munchNote(`Checking compendium folders..`, true);
  await compendiumFolders.loadCompendium("vehicles");
  utils.munchNote("", true);

  let vehiclesParsed = [];
  let currentVehicle = 1;
  const vehicleCount = vehicleHandler.documents.length;
  utils.munchNote(`Preparing to wax ${vehicleCount} vehicles!`, true);
  for (const vehicle of vehicleHandler.documents) {
    utils.munchNote(`[${currentVehicle}/${vehicleCount}] Importing ${vehicle.name}`, false, true);
    logger.debug(`Importing/second parse of ${vehicle.name} data`);
    const munched = await DDBMonsterImporter.addNPC(vehicle, "vehicle");
    vehiclesParsed.push(munched);
    currentVehicle += 1;
  }
  logger.debug("Vehicles Parsed", vehiclesParsed);
  utils.munchNote("", false, true);
  foundry.utils.setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});

  if (ids !== null) {
    return Promise.all(vehiclesParsed);
  }
  return vehicleCount;
}
