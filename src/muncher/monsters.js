// Main module class
import { srdFiddling, getCompendiumItems, removeItems } from "./import.js";
import { munchNote, download } from "./utils.js";
import logger from "../logger.js";
import { addNPC, generateIconMap, copyExistingMonsterImages, checkCompendium } from "./importMonster.js";
import { parseMonsters } from "./monster/monster.js";
import utils from "../utils.js";
import { getCobalt } from "../lib/Secrets.js";

window.ddbParseMonsters = parseMonsters;

async function getMonsterData() {
  const cobaltCookie = getCobalt();
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const searchTerm = $("#monster-munch-filter")[0].value;
  const debugJson = game.settings.get("ddb-importer", "debug-json");
  const homebrew = game.settings.get("ddb-importer", "munching-policy-monster-homebrew");
  const homebrewOnly = game.settings.get("ddb-importer", "munching-policy-monster-homebrew-only");
  const exactMatch = game.settings.get("ddb-importer", "munching-policy-monster-exact-match");
  const sources = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat();
  const body = {
    cobalt: cobaltCookie,
    betaKey: betaKey,
    search: searchTerm,
    homebrew: homebrew,
    homebrewOnly: homebrewOnly,
    searchTerm: encodeURIComponent(searchTerm),
    exactMatch: exactMatch,
    sources: sources,
  };

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/monster`, {
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

export async function parseCritters() {
  await checkCompendium();
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
  const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");

  // to speed up file checking we pregenerate existing files now.
  await utils.generateCurrentFiles(uploadDirectory);

  let monsters = await getMonsterData();

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

  let currentMonster = 1;
  const monsterCount = finalMonsters.length;
  munchNote(`Importing ${monsterCount} monsters!`, true);
  for (const monster of finalMonsters) {
    munchNote(`Importing ${monster.name} (${currentMonster}/${monsterCount})`, false, true);
    logger.debug(`Importing ${monster.name}`);
    // eslint-disable-next-line no-await-in-loop
    await addNPC(monster);
    currentMonster += 1;
  }
  munchNote("", false, true);
  return monsterCount;
}
