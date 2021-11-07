// Main module class
import { srdFiddling, getCompendiumItems, removeItems } from "./import.js";
import { munchNote, download } from "./utils.js";
import logger from "../logger.js";
import { addNPC, generateIconMap, copyExistingMonsterImages, checkMonsterCompendium } from "./importMonster.js";
import { parseMonsters } from "./monster/monster.js";
import utils from "../utils.js";
import { getCobalt } from "../lib/Secrets.js";
import { createCompendiumFolderStructure } from "./compendiumFolders.js";

async function getMonsterData(ids) {
  const cobaltCookie = getCobalt();
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");

  const body = {
    cobalt: cobaltCookie,
    betaKey: betaKey,
  };

  if (ids && ids.length > 0) {
    body.ids = [...new Set(ids)];
  } else {
    const searchTerm = $("#monster-munch-filter")[0].value;
    body.sources = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat();
    body.search = $("#monster-munch-filter")[0].value;
    body.homebrew = body.sources.length > 0 ? false : game.settings.get("ddb-importer", "munching-policy-monster-homebrew");
    body.homebrewOnly = body.sources.length > 0 ? false : game.settings.get("ddb-importer", "munching-policy-monster-homebrew-only");
    body.searchTerm = encodeURIComponent(searchTerm);
    body.exactMatch = game.settings.get("ddb-importer", "munching-policy-monster-exact-match");
    body.sources = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat();
  }

  const debugJson = game.settings.get("ddb-importer", "debug-json");

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
          munchNote(`API Failure: ${data.message}`);
          reject(data.message);
        }
        if (debugJson) {
          download(JSON.stringify(data), `monsters-raw.json`, "application/json");
        }
        return data;
      })
      .then((data) => {
        munchNote(`Retrieved ${data.data.length} monsters, starting parse...`, true, false);
        logger.info(`Retrieved ${data.data.length} monsters`);
        const parsedMonsters = parseMonsters(data.data);
        return parsedMonsters;
      })
      .then((data) => {
        munchNote(
          `Parsed ${data.actors.length} monsters, failed ${data.failedMonsterNames.length} monsters`,
          false,
          true
        );
        if (data.failedMonsterNames && data.failedMonsterNames.length !== 0)
          logger.error(`Failed to parse ${data.failedMonsterNames}`);
        resolve(data.actors);
      })
      .catch((error) => reject(error));
  });
}

export async function parseCritters(ids = null) {
  checkMonsterCompendium();
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
  const uploadDirectory = game.settings.get("ddb-importer", "other-image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  logger.info("Checking for existing files...");
  await utils.generateCurrentFiles(uploadDirectory);
  logger.info("Check complete getting monster data...");
  let monsters = await getMonsterData(ids);

  if (!updateBool || !updateImages) {
    munchNote(`Calculating which monsters to update...`, true);
    const existingMonsters = await getCompendiumItems(monsters, "npc");
    const existingMonstersTotal = existingMonsters.length + 1;
    if (!updateBool) {
      logger.debug("Removing existing monsters from import list");
      logger.debug(`Matched ${existingMonstersTotal}`);
      munchNote(`Removing ${existingMonstersTotal} from update...`);
      monsters = await removeItems(monsters, existingMonsters);
    }
    if (!updateImages) {
      logger.debug("Copying monster images across...");
      munchNote(`Copying images for ${existingMonstersTotal} monsters...`);
      monsters = copyExistingMonsterImages(monsters, existingMonsters);
    }
  }
  munchNote("");
  munchNote(`Fiddling with the SRD data...`, true);
  const finalMonsters = await srdFiddling(monsters, "monsters");

  // let features = [];
  // let cr = [];
  // console.warn(finalMonsters);
  // finalMonsters.forEach((monster) => {
  //   cr.push({name: monster.name, cr: monster.data.details.cr, type: monster.data.details.type });
  // monster.items.forEach((feature) => {
  //   features.push({ name: feature.name, monster: monster.name, srdImage: feature.img});
  // })
  // });
  // download(JSON.stringify(features), `monster-features.json`, "application/json");
  // download(JSON.stringify(cr), `monster-details.json`, "application/json");
  // return 0;

  munchNote(`Generating Icon Map..`, true);
  await generateIconMap(finalMonsters);


  const addToCompendiumFolder = game.settings.get("ddb-importer", "munching-policy-use-compendium-folders");
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");
  if (addToCompendiumFolder && compendiumFoldersInstalled) {
    munchNote(`Checking compendium folders..`, true);
    await createCompendiumFolderStructure("monsters");
  }

  let monstersParsed = [];
  let currentMonster = 1;
  const monsterCount = finalMonsters.length;
  munchNote(`Importing ${monsterCount} monsters!`, true);
  for (const monster of finalMonsters) {
    munchNote(`Importing ${monster.name} (${currentMonster}/${monsterCount})`, false, true);
    logger.debug(`Importing ${monster.name}`);
    // eslint-disable-next-line no-await-in-loop
    const munched = await addNPC(monster);
    monstersParsed.push(munched);
    currentMonster += 1;
  }
  munchNote("", false, true);

  if (ids !== null) {
    return Promise.all(monstersParsed);
  }
  return monsterCount;
}
