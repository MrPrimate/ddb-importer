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
};

async function loadIconMap(type) {
  // check to see if dictionary is loaded
  console.debug(`Loading Inbuilt Icon Map for ${type}`);
  if (iconMap[type]) return;

  // const path = `${BASE_PATH}/modules/ddb-importer/data/${type}.json`;
  //const fileExists = await utils.serverFileExists(path);
  const fileExists = await utils.fileExists("[data] modules/ddb-importer/data", `${type}.json`);

  if (fileExists) {
    let url = await utils.getFileUrl("[data] modules/ddb-importer/data", `${type}.json`);
    let response = await fetch(url, { method: "GET" });
    iconMap[type] = await response.json();
  }
  console.warn(iconMap);
}

function getIconPath(name, type) {
  // check to see if we are able to load a dic for that type
  const typeValue = TYPE_MAP[type];
  if (!typeValue || !iconMap[typeValue]) return null;

  const iconMatch = iconMap[typeValue].find((entry) => entry.name === name);
  if (iconMatch) {
    return iconMatch.path;
  } else {
    return null;
  }
}


async function loadIconMaps(types) {
  let promises = [];

  const mapTypes = types
    .filter((type) => TYPE_MAP[type])
    .map((type) => TYPE_MAP[type]).filter((type, i, ar) => ar.indexOf(type) === i);

  mapTypes.forEach((type) => {
    console.warn(`Loading ${type}`);
    promises.push(loadIconMap(type));
  });
  console.log(promises);
  return Promise.all(promises);
}

export async function copyInbuiltIcons(items) {
  // eslint-disable-next-line require-atomic-updates

  // get unique array of item types to be matching
  const itemTypes = items.map((item) => item.type).filter((item, i, ar) => ar.indexOf(item) === i);

  await loadIconMaps(itemTypes);

  return new Promise((resolve) => {
    const iconItems = items.map((item) => {
      logger.debug(`Inbuilt icon match started for ${item.name}`);
      const pathMatched = getIconPath(item.name, item.type);
      if (pathMatched) item.img = pathMatched;
      return item;
    });
    resolve(iconItems);
  });
}
