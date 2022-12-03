// Main module class
import { srdFiddling, getCompendiumItems, removeItems } from "./import.js";
import DDBMuncher from "./DDBMuncher.js";
import logger from "../logger.js";
import { addNPC, generateIconMap, copyExistingMonsterImages, addNPCDDBId, addNPCsToCompendium } from "./importMonster.js";
import { parseMonsters } from "../parser/monster/monster.js";
import FileHelper from "../lib/FileHelper.js";
import { getCobalt } from "../lib/Secrets.js";
import { createCompendiumFolderStructure } from "./compendiumFolders.js";
import SETTINGS from "../settings.js";
import DDBProxy from "../lib/DDBProxy.js";

async function getMonsterData(ids) {
  const cobaltCookie = getCobalt();
  const betaKey = game.settings.get(SETTINGS.MODULE_ID, "beta-key");
  const parsingApi = DDBProxy.getProxy();

  const body = {
    cobalt: cobaltCookie,
    betaKey: betaKey,
  };

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
          DDBMuncher.munchNote(`API Failure: ${data.message}`);
          logger.error(`API Failure:`, data.message);
          reject(data.message);
        }
        if (debugJson) {
          FileHelper.download(JSON.stringify(data), `monsters-raw.json`, "application/json");
        }
        return data;
      })
      .then((data) => {
        DDBMuncher.munchNote(`Retrieved ${data.data.length} monsters, starting parse...`, true, false);
        logger.info(`Retrieved ${data.data.length} monsters`);
        const parsedMonsters = parseMonsters(data.data);
        return parsedMonsters;
      })
      .then((data) => {
        DDBMuncher.munchNote(
          `Parsed ${data.actors.length} monsters, failed ${data.failedMonsterNames.length} monsters`,
          false,
          true
        );
        logger.info(`Parsed ${data.actors.length} monsters, failed ${data.failedMonsterNames.length} monsters`);
        if (data.failedMonsterNames && data.failedMonsterNames.length !== 0) {
          logger.error(`Failed to parse`, data.failedMonsterNames);
        }
        resolve(data.actors);
      })
      .catch((error) => reject(error));
  });
}

export async function parseCritters(ids = null) {
  setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});
  const updateBool = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing");
  const updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
  const uploadDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
  const bulkImport = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-bulk-import");

  // to speed up file checking we pregenerate existing files now.
  logger.info("Checking for existing files...");
  DDBMuncher.munchNote(`Checking existing image files...`);
  await FileHelper.generateCurrentFiles(uploadDirectory);
  await FileHelper.generateCurrentFiles("[data] modules/ddb-importer/data");
  logger.info("Check complete getting monster data...");
  DDBMuncher.munchNote(`Getting monster data from DDB...`);
  let monsters = await getMonsterData(ids);

  if (!updateBool || !updateImages) {
    DDBMuncher.munchNote(`Calculating which monsters to update...`, true);
    const existingMonsters = await getCompendiumItems(monsters, "npc", { keepDDBId: true });
    const existingMonstersTotal = existingMonsters.length + 1;
    if (!updateBool) {
      logger.debug("Removing existing monsters from import list");
      logger.debug(`Matched ${existingMonstersTotal}`);
      DDBMuncher.munchNote(`Removing ${existingMonstersTotal} from update...`);
      monsters = await removeItems(monsters, existingMonsters, true);
    }
    if (!updateImages) {
      logger.debug("Copying monster images across...");
      DDBMuncher.munchNote(`Copying images for ${existingMonstersTotal} monsters...`);
      monsters = copyExistingMonsterImages(monsters, existingMonsters);
    }
  }
  DDBMuncher.munchNote("");
  DDBMuncher.munchNote(`Fiddling with the SRD data...`, true);
  const finalMonsters = await srdFiddling(monsters, "monsters");

  DDBMuncher.munchNote(`Generating Icon Map..`, true);
  await generateIconMap(finalMonsters);

  const addToCompendiumFolder = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-compendium-folders");
  const compendiumFoldersInstalled = game.modules.get("compendium-folders")?.active;
  if (addToCompendiumFolder && compendiumFoldersInstalled) {
    DDBMuncher.munchNote(`Checking compendium folders..`, true);
    await createCompendiumFolderStructure("monsters");
    DDBMuncher.munchNote("", true);
  }

  let monstersParsed = [];
  let currentMonster = 1;
  const monsterCount = finalMonsters.length;
  DDBMuncher.munchNote(`Preparing dinner for ${monsterCount} monsters!`, true);
  for (const monster of finalMonsters) {
    if (bulkImport) {
      DDBMuncher.munchNote(`[${currentMonster}/${monsterCount}] Checking dietary requirements for ${monster.name}`, false, true);
    } else {
      DDBMuncher.munchNote(`[${currentMonster}/${monsterCount}] Importing ${monster.name}`, false, true);
    }
    logger.debug(`Importing/second parse of ${monster.name} data`);
    // eslint-disable-next-line no-await-in-loop
    const munched = await addNPC(monster, bulkImport, "monster");
    monstersParsed.push(munched);
    currentMonster += 1;
  }
  logger.debug("Monsters Parsed", monstersParsed);
  if (bulkImport) {
    DDBMuncher.munchNote(`Importing ${monstersParsed.length} monsters`, false, true);
    logger.debug(`Importing ${monstersParsed.length} monsters`);
    await addNPCsToCompendium(monstersParsed, "monster");
  }
  DDBMuncher.munchNote("", false, true);
  setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});

  if (ids !== null) {
    return Promise.all(monstersParsed);
  }
  return monsterCount;
}

export async function fixCritters(ids = null) {
  setProperty(CONFIG.DDBI, "MUNCHER.TEMPORARY", {});

  logger.info("Check complete getting monster data...");
  let monsters = await getMonsterData(ids);

  for (const monster of monsters) {
    logger.warn(`Fixing ${monster.name}`);
    // eslint-disable-next-line no-await-in-loop
    await addNPCDDBId(monster, "monster");
  }

  logger.info("Update complete!");
}
