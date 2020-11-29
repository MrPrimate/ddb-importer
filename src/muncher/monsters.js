// Main module class
import { srdFiddling, getCompendiumItems, removeItems, munchNote, getSRDIconLibrary, copySRDIcons } from "./import.js";
import logger from "../logger.js";
import { addNPC } from "./importMonster.js";
import { parseMonsters } from "./monster/monster.js";

async function getMonsterData() {
  const cobaltCookie = game.settings.get("ddb-importer", "cobalt-cookie");
  const betaKey = game.settings.get("ddb-importer", "beta-key");
  const parsingApi = game.settings.get("ddb-importer", "api-endpoint");
  const body = { cobalt: cobaltCookie, betaKey: betaKey };
  const searchTerm = $("#monster-munch-filter")[0].value;

  return new Promise((resolve, reject) => {
    fetch(`${parsingApi}/proxy/getMonster/${searchTerm}`, {
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
        return data;
      })
      .then((data) => {
        munchNote(`Retrieved ${data.data.length + 1} monsters, starting parse...`, true, false);
        logger.info(`Retrieved ${data.data.length + 1} monsters`);
        const parsedMonsters = parseMonsters(data.data);
        return parsedMonsters;
      })
      .then((data) => {
        munchNote(`Parsed ${data.actors.length} monsters, failed ${data.failedMonsterNames} monsters`, false, true);
        if (data.failedMonsterNames && data.failedMonsterNames.length !== 0) logger.error(`Failed to parse ${data.failedMonsterNames}`);
        resolve(data.actors);
      })
      .catch((error) => reject(error));
  });
}

async function generateIconMap(monsters) {
  let promises = [];

  const srdIcons = game.settings.get("ddb-importer", "munching-policy-use-srd-icons");
  // eslint-disable-next-line require-atomic-updates
  if (srdIcons) {
    const srdIconLibrary = await getSRDIconLibrary();
    munchNote(`Updating SRD Icons`, true);
    let itemMap = [];

    monsters.forEach((monster) => {
      munchNote(`Processing ${monster.name}`);
      promises.push(
        copySRDIcons(monster.items, srdIconLibrary, itemMap).then((items) => {
          monster.items = items;
        })
      );
    });
  }

  return Promise.all(promises);
}

export async function parseCritters() {
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  let monsters = await getMonsterData();

  if (!updateBool) {
    munchNote(`Calculating which monsters to update...`, true);
    logger.debug("Removing existing monsters from import list");
    const existingMonsters = await getCompendiumItems(monsters, "npc");
    const existingMonstersTotal = existingMonsters.length + 1;
    logger.debug(`Matched ${existingMonstersTotal}`);
    munchNote(`Removing ${existingMonstersTotal} from update...`);
    monsters = await removeItems(monsters, existingMonsters);
  }
  munchNote("");
  munchNote(`Fiddling with the SRD data...`, true);
  const finalMonsters = await srdFiddling(monsters, "monsters");

  munchNote(`Generating Icon Map..`, true);
  await generateIconMap(finalMonsters);

  let currentMonster = 1;
  const monsterCount = finalMonsters.length + 1;
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
