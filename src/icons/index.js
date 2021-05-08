import utils from "../utils.js";
import logger from "../logger.js";

var iconMap = {};

// const BASE_PATH = ROUTE_PREFIX ? `/${ROUTE_PREFIX}` : "";

const TYPE_MAP = {
  items: "items",
  weapons: "items",
  weapon: "items",
  item: "items",
  equipment: "items",
  consumable: "items",
  tool: "items",
  loot: "items",
  backpack: "items",
  inventory: "items",
  spells: "spells",
  spell: "spells",
  feats: "feats",
  feat: "feats",
  classes: "classes",
  class: "classes",
  monster: "monster",
};

const FILE_MAP = {
  items: ["items.json"],
  spells: ["spells.json"],
  feats: ["feats.json", "class-features.json", "races.json", "general.json"],
  classes: ["classes.json"],
  monster: ["monster-features.json"],
};

async function loadDataFile(fileName) {
  logger.debug(`Getting icon mapping for ${fileName}`);
  const fileExists = await utils.fileExists("[data] modules/ddb-importer/data", fileName);

  let data = [];
  if (fileExists) {
    const url = await utils.getFileUrl("[data] modules/ddb-importer/data", fileName);
    const response = await fetch(url, { method: "GET" });
    // eslint-disable-next-line require-atomic-updates
    data = await response.json();
  }
  return data;
}

async function loadIconMap(type) {
  // check to see if dictionary is loaded
  logger.debug(`Loading Inbuilt Icon Map for ${type}`);
  if (iconMap[type]) return;

  let data = [];
  for (const fileName of FILE_MAP[type]) {
    // eslint-disable-next-line no-await-in-loop
    const dataLoad = await loadDataFile(fileName);
    data = data.concat(dataLoad);
  }

  iconMap[type] = data;
  // console.warn(iconMap);
}

function looseMatch(item, typeValue) {
  const originalName = item.flags?.ddbimporter?.originalName;
  if (originalName) {
    const originalMatch = iconMap[typeValue].find((entry) => entry.name === originalName);
    if (originalMatch) return originalMatch.path;
  }

  if (item.name.includes(":")) {
    const nameArray = item.name.split(":");
    const postMatch = iconMap[typeValue].find((entry) => entry.name === nameArray[1].trim());
    if (postMatch) return postMatch.path;
    const subMatch = iconMap[typeValue].find((entry) => entry.name === nameArray[0].trim());
    if (subMatch) return subMatch.path;
  }

  const startsMatchEntry = iconMap[typeValue].find((entry) => item.name.split(":")[0].trim().startsWith(entry.name.split(":")[0].trim()));
  if (startsMatchEntry) return startsMatchEntry.path;
  const startsMatchItem = iconMap[typeValue].find((entry) => entry.name.split(":")[0].trim().startsWith(item.name.split(":")[0].trim()));
  if (startsMatchItem) return startsMatchItem.path;

  return null;
}

function getIconPath(item, type, monsterName) {
  // check to see if we are able to load a dic for that type
  const typeValue = TYPE_MAP[type];
  if (!typeValue || !iconMap[typeValue]) return null;

  const iconMatch = iconMap[typeValue].find((entry) => {
    if (type === "monster") {
      return entry.name === item.name.split("(")[0].trim() && entry.monster == monsterName;
    }
    return entry.name === item.name;
  });
  if (iconMatch) {
    return iconMatch.path;
  } else {
    return looseMatch(item, typeValue);
  }
}


async function loadIconMaps(types) {
  let promises = [];

  const mapTypes = types
    .filter((type) => TYPE_MAP[type])
    .map((type) => TYPE_MAP[type]).filter((type, i, ar) => ar.indexOf(type) === i);

  mapTypes.forEach((type) => {
    logger.debug(`Loading ${type}`);
    promises.push(loadIconMap(type));
  });

  return Promise.all(promises);
}

export async function copyInbuiltIcons(items, monster = false, monsterName = "") {
  // eslint-disable-next-line require-atomic-updates

  // get unique array of item types to be matching
  const itemTypes = items.map((item) => item.type).filter((item, i, ar) => ar.indexOf(item) === i);

  if (monster) itemTypes.push("monster");
  await loadIconMaps(itemTypes);

  return new Promise((resolve) => {
    const iconItems = items.map((item) => {
      // logger.debug(`Inbuilt icon match started for ${item.name} [${item.type}]`);
      // if we have a monster lets check the monster dict first
      if (monster) {
        const monsterPath = getIconPath(item, "monster", monsterName);
        if (monsterPath) {
          item.img = monsterPath;
          return item;
        }
      }
      const pathMatched = getIconPath(item, item.type);
      if (pathMatched) item.img = pathMatched;
      return item;
    });
    resolve(iconItems);
  });
}
