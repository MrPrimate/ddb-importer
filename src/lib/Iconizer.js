import logger from "../logger.js";
import FileHelper from "./FileHelper.js";

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
  subclass: "classes",
  monster: "monster",
  backgrounds: "backgrounds",
  background: "backgrounds",
  traits: "traits",
  races: "races",
  race: "races",
};

const FILE_MAP = {
  items: ["items.json", "class-features.json", "races.json"],
  traits: ["class-features.json", "races.json", "general.json", "items.json"],
  spells: ["spells.json"],
  races: ["races.json"],
  feats: ["feats.json", "class-features.json", "races.json", "general.json"],
  classes: ["classes.json"],
  monster: ["named-monster-features.json", "generic-monster-features.json"],
  backgrounds: ["backgrounds.json", "feats.json", "class-features.json", "races.json", "general.json"],
};

function sanitiseName(name) {
  return name.replace("’", "'").toLowerCase();
}

async function loadDataFile(fileName) {
  logger.debug(`Getting icon mapping for ${fileName}`);
  const fileExists = await FileHelper.fileExists("[data] modules/ddb-importer/data", fileName);

  const url = await FileHelper.getFileUrl("[data] modules/ddb-importer/data", fileName);
  if (!fileExists) {
    logger.warn(`Possible missing file, icon load may fail. Fetching ${url}`);
  }

  const data = await fetchJsonWithTimeout(url);
  return data;
}

async function loadIconMap(type) {
  // check to see if dictionary is loaded
  if (CONFIG.DDBI.ICONS[type]) return;

  logger.debug(`Loading Inbuilt Icon Map for ${type}`);
  let data = [];
  for (const fileName of FILE_MAP[type]) {
    // eslint-disable-next-line no-await-in-loop
    const dataLoad = await loadDataFile(fileName);
    data = data.concat(dataLoad);
  }

  CONFIG.DDBI.ICONS[type] = data;
  // console.warn(iconMap);
}

function looseMatch(item, typeValue) {
  const originalName = item.flags?.ddbimporter?.originalName;
  if (originalName) {
    const originalMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitiseName(entry.name) === sanitiseName(originalName));
    if (originalMatch) return originalMatch.path;
  }

  const sanitisedName = sanitiseName(item.name);
  if (item.name.includes(":")) {
    const nameArray = sanitisedName.split(":");
    const postMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitiseName(entry.name) === nameArray[1].trim());
    if (postMatch) return postMatch.path;
    const subMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitiseName(entry.name) === nameArray[0].trim());
    if (subMatch) return subMatch.path;
  }

  const startsMatchEntry = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitisedName.split(":")[0].trim().startsWith(sanitiseName(entry.name).split(":")[0].trim()));
  if (startsMatchEntry) return startsMatchEntry.path;
  const startsMatchItem = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitiseName(entry.name).split(":")[0].trim().startsWith(sanitisedName.split(":")[0].trim()));
  if (startsMatchItem) return startsMatchItem.path;

  if (item.type === "subclass" && item.system.classIdentifier) {
    const sanitisedClassName = sanitiseName(item.system.classIdentifier);
    const subClassMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitiseName(entry.name).startsWith(sanitisedClassName));
    if (subClassMatch) return subClassMatch.path;
  }

  return null;
}

function getIconPath(item, type, monsterName) {
  // check to see if we are able to load a dic for that type
  const typeValue = TYPE_MAP[type];
  if (!typeValue || !CONFIG.DDBI.ICONS[typeValue]) return null;

  const iconMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => {
    const sanitisedName = sanitiseName(entry.name);
    const sanitisedItemName = sanitiseName(item.name);
    if (type === "monster") {
      return sanitisedName === sanitisedItemName.split("(")[0].trim() && entry.monster && sanitiseName(entry.monster) == sanitiseName(monsterName);
    }
    return sanitisedName === sanitisedItemName;
  });

  if (!iconMatch && type === "monster") {
    const genericMonsterIconMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => {
      const sanitisedName = sanitiseName(entry.name);
      const sanitisedItemName = sanitiseName(item.name);
      return sanitisedName === sanitisedItemName;
    });
    if (genericMonsterIconMatch) return genericMonsterIconMatch.path;
  }

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
    // logger.debug(`Loading ${type}`);
    promises.push(loadIconMap(type));
  });

  return Promise.all(promises);
}

export async function iconPath(item, monster = false, monsterName = "") {
  const itemTypes = [item.type];
  if (monster) itemTypes.push("monster");
  await loadIconMaps(itemTypes);

  let iconPath;
  // logger.debug(`Inbuilt icon match started for ${item.name} [${item.type}]`);
  // if we have a monster lets check the monster dict first
  if (monster) {
    const monsterPath = getIconPath(item, "monster", monsterName);
    if (monsterPath) {
      iconPath = monsterPath;
    }
  }
  if (!iconPath) iconPath = getIconPath(item, item.type);
  return iconPath;
}

export async function copyInbuiltIcons(items, monster = false, monsterName = "") {
  // get unique array of item types to be matching
  const itemTypes = items.map((item) => item.type).filter((item, i, ar) => ar.indexOf(item) === i);

  if (monster) itemTypes.push("monster");
  await loadIconMaps(itemTypes);

  return new Promise((resolve) => {
    const iconItems = items.map((item) => {
      if (getProperty(item, "flags.ddbimporter.keepIcon") !== true) {
        // logger.debug(`Inbuilt icon match started for ${item.name} [${item.type}]`);
        // if we have a monster lets check the monster dict first
        if (monster && !["spell"].includes(item.type)) {
          const monsterPath = getIconPath(item, "monster", monsterName);
          if (monsterPath) {
            item.img = monsterPath;
            return item;
          }
        }
        const pathMatched = getIconPath(item, item.type);
        if (pathMatched) {
          item.img = pathMatched;
          if (item.effects) {
            item.effects.forEach((effect) => {
              if (!effect.icon || effect.icon === "") {
                effect.icon = pathMatched;
              }
            });
          }
        }
      }
      return item;
    });
    resolve(iconItems);
  });
}


const STUBS = {
  1: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
  viewBox="0 0 512 512" width="512" height="512">
    <g>
      <circle style="fill:#ffffff;stroke:#010101;stroke-width:30;stroke-miterlimit:10;" cx="250" cy="250" r="220">
      </circle>
      <text font-family='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' font-size="300" font-weight="400" fill="black" x="50%" y="52%" text-anchor="middle" stroke="#000000" dy=".3em">REPLACEME</text>
    </g>
  </svg>`,
  2: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
  viewBox="0 0 512 512" width="512" height="512">
    <g>
      <circle style="fill:#ffffff;stroke:#010101;stroke-width:30;stroke-miterlimit:10;" cx="250" cy="250" r="220">
      </circle>
      <text font-family='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' font-size="230" font-weight="400" fill="black" x="50%" y="52%" text-anchor="middle" stroke="#000000" dy=".3em">REPLACEME</text>
    </g>
  </svg>`,
  3: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
  viewBox="0 0 512 512" width="512" height="512">
    <g>
      <circle style="fill:#ffffff;stroke:#010101;stroke-width:30;stroke-miterlimit:10;" cx="250" cy="250" r="220">
      </circle>
      <text font-family='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' font-size="170" font-weight="400" fill="black" x="50%" y="52%" text-anchor="middle" stroke="#000000" dy=".3em">REPLACEME</text>
    </g>
  </svg>`,
  4: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
  viewBox="0 0 512 512" width="512" height="512">
    <g>
      <circle style="fill:#ffffff;stroke:#010101;stroke-width:30;stroke-miterlimit:10;" cx="250" cy="250" r="220">
      </circle>
      <text font-family='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' font-size="140" font-weight="400" fill="black" x="50%" y="52%" text-anchor="middle" stroke="#000000" dy=".3em">REPLACEME</text>
    </g>
  </svg>`,
};

function unPad(match, p1) {
  if (isNaN(parseInt(p1))) {
    return p1;
  } else {
    return parseInt(p1);
  }
}

export async function generateIcon(adventure, title) {
  // default path
  let iconPath = "icons/svg/book.svg";
  let stub = title.trim().split(".")[0].split(" ")[0];
  stub = stub.replace(/(\d+)/, unPad);
  if (stub.length <= 4) {
    iconPath = `assets/icons/${stub}.svg`;
    logger.info(stub);
    let content = STUBS[stub.length];
    content = content.replace("REPLACEME", stub);
    const uploadPath = await adventure.importRawFile(iconPath, content, "text/plain", true);
    return uploadPath;
  }
  return iconPath;
}
