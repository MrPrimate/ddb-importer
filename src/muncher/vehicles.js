import logger from "../logger.js";
import FileHelper from "../lib/FileHelper.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import {
  addNPC,
  generateIconMap,
  copyExistingMonsterImages,
} from "./importMonster.js";
import { getCobalt } from "../lib/Secrets.js";
import DDBCampaigns from "../lib/DDBCampaigns.js";
import { parseVehicles } from "../parser/vehicle/vehicle.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";
import PatreonHelper from "../lib/PatreonHelper.js";
import { DDBCompendiumFolders } from "../lib/DDBCompendiumFolders.js";
import DDBItemImporter from "../lib/DDBItemImporter.js";

/**
 *
 * @returns {Promise<Array<JSON>>} A promise that resolves to an array of JSON vehicles from DDB
 */
export function getVehicleData(ids) {
  const cobaltCookie = getCobalt();
  const betaKey = PatreonHelper.getPatreonKey();
  const parsingApi = DDBProxy.getProxy();

  const campaignId = DDBCampaigns.getCampaignId();
  const body = { cobalt: cobaltCookie, campaignId: campaignId, betaKey: betaKey };

  if (ids && ids.length > 0) {
    body.ids = [...new Set(ids)];
  } else {
    const searchFilter = $("#monster-munch-filter")[0];
    const searchTerm = searchFilter?.value || "";
    const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
    const sources = enableSources
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-sources").flat()
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
          DDBMuncher.munchNote(`Failure: ${data.message}`);
          reject(data.message);
        }
        return data;
      })
      .then((data) => resolve(data.data))
      .catch((error) => reject(error));
  });
}

/**
 *
 * @param {*} ddbData json data from DDB
 * @returns array of vehicles processed to Foundry
 */
async function processVehicleData(ddbData) {
  DDBMuncher.munchNote(`Retrieved ${ddbData.length} vehicles, starting parse...`, true, false);
  logger.info(`Retrieved ${ddbData.length} vehicles`);
  const parsedVehicles = await parseVehicles(ddbData);

  DDBMuncher.munchNote(
    `Parsed ${parsedVehicles.actors.length} vehicles, failed ${parsedVehicles.failedVehicleNames.length} vehicles`,
    false,
    true
  );
  logger.info(`Parsed ${parsedVehicles.actors.length} vehicles, failed ${parsedVehicles.failedVehicleNames.length} vehicles`);
  if (parsedVehicles.failedVehicleNames && parsedVehicles.failedVehicleNames.length !== 0) {
    logger.error(`Failed to parse`, parsedVehicles.failedVehicleNames);
  }
  return parsedVehicles.actors;
}


export async function parseTransports(ids = null) {
  foundry.utils.setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  logger.info("Checking for existing files...");
  DDBMuncher.munchNote(`Checking existing image files...`);
  await FileHelper.generateCurrentFiles(uploadDirectory);
  logger.info("Check complete getting vehicle data...");
  DDBMuncher.munchNote(`Getting vehicle data from DDB...`);
  let vehicleJSON = await getVehicleData(ids);
  let vehicles = await processVehicleData(vehicleJSON);

  const vehicleHandler = new DDBItemImporter("vehicles", vehicles);
  await vehicleHandler.init();

  if (!updateBool || !updateImages) {
    DDBMuncher.munchNote(`Calculating which vehicles to update...`, true);
    const existingVehicles = await DDBItemImporter.getCompendiumItems(vehicles, "vehicles", { keepDDBId: true });
    const existingVehiclesTotal = existingVehicles.length + 1;
    if (!updateBool) {
      logger.debug("Removing existing vehicles from import list");
      logger.debug(`Matched ${existingVehiclesTotal}`);
      DDBMuncher.munchNote(`Removing ${existingVehiclesTotal} from update...`);
      vehicleHandler.removeItems(existingVehicles);
    }
    if (!updateImages) {
      logger.debug("Copying vehicle images across...");
      DDBMuncher.munchNote(`Copying images for ${existingVehiclesTotal} vehicles...`);
      vehicles = copyExistingMonsterImages(vehicles, existingVehicles);
    }
  }
  DDBMuncher.munchNote("");
  DDBMuncher.munchNote(`Fiddling with the SRD data...`, true);
  await vehicleHandler.srdFiddling();
  await vehicleHandler.iconAdditions();

  DDBMuncher.munchNote(`Generating Icon Map..`, true);
  await generateIconMap(vehicleHandler.documents);

  // Compendium folders not yet in use for Vehicles
  const addToCompendiumFolder = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-compendium-folders");
  if (addToCompendiumFolder) {
    const compendiumFolders = new DDBCompendiumFolders("vehicles");
    DDBMuncher.munchNote(`Checking compendium folders..`, true);
    await compendiumFolders.loadCompendium("vehicles");
    DDBMuncher.munchNote("", true);
  }

  let vehiclesParsed = [];
  let currentVehicle = 1;
  const vehicleCount = vehicleHandler.documents.length;
  DDBMuncher.munchNote(`Preparing to wax ${vehicleCount} vehicles!`, true);
  for (const vehicle of vehicleHandler.documents) {
    DDBMuncher.munchNote(`[${currentVehicle}/${vehicleCount}] Importing ${vehicle.name}`, false, true);
    logger.debug(`Importing/second parse of ${vehicle.name} data`);
    // eslint-disable-next-line no-await-in-loop
    const munched = await addNPC(vehicle, "vehicle");
    vehiclesParsed.push(munched);
    currentVehicle += 1;
  }
  logger.debug("Vehicles Parsed", vehiclesParsed);
  DDBMuncher.munchNote("", false, true);
  foundry.utils.setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});

  if (ids !== null) {
    return Promise.all(vehiclesParsed);
  }
  return vehicleCount;
}
