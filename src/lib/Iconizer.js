import DDBMuncher from "../apps/DDBMuncher.js";
import DICTIONARY from "../dictionary.js";
import logger from "../logger.js";
import SETTINGS from "../settings.js";
import CompendiumHelper from "./CompendiumHelper.js";
import FileHelper from "./FileHelper.js";
import NameMatcher from "./NameMatcher.js";
import utils from "./utils.js";

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
  container: "items",
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
  return utils.nameString(name).toLowerCase();
}

async function loadDataFile(fileName) {
  logger.debug(`Getting icon mapping for ${fileName}`);
  const fileExists = await FileHelper.fileExists("[data] modules/ddb-importer/data", fileName);

  const url = await FileHelper.getFileUrl("[data] modules/ddb-importer/data", fileName);
  if (!fileExists) {
    logger.warn(`Possible missing file, icon load may fail. Fetching ${url}`);
  }

  const data = await foundry.utils.fetchJsonWithTimeout(url);
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

export default class Iconizer {

  static async generateIcon(adventure, title) {
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

  static async iconPath(item, monster = false, monsterName = "") {
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

  static async copyInbuiltIcons(items, monster = false, monsterName = "") {
    // get unique array of item types to be matching
    const itemTypes = items.map((item) => item.type).filter((item, i, ar) => ar.indexOf(item) === i);

    if (monster) itemTypes.push("monster");
    await loadIconMaps(itemTypes);

    return new Promise((resolve) => {
      const iconItems = items.map((item) => {
        if (foundry.utils.getProperty(item, "flags.ddbimporter.keepIcon") !== true) {
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

  static async getSRDIconMatch(type) {
    const compendiumName = SETTINGS.SRD_COMPENDIUMS.find((c) => c.type == type).name;
    const srdPack = CompendiumHelper.getCompendium(compendiumName);
    const srdIndices = ["name", "img", "prototypeToken.texture.src", "type", "system.activation", "prototypeToken.texture.scaleY", "prototypeToken.texture.scaleX"];
    const index = await srdPack.getIndex({ fields: srdIndices });
    return index;
  }

  static async getSRDImageLibrary() {
    if (CONFIG.DDBI.SRD_LOAD.mapLoaded) return CONFIG.DDBI.SRD_LOAD.iconMap;
    const compendiumFeatureItems = await Iconizer.getSRDIconMatch("features");
    const compendiumInventoryItems = await Iconizer.getSRDIconMatch("inventory");
    const compendiumSpellItems = await Iconizer.getSRDIconMatch("spells");
    const compendiumMonsterFeatures = await Iconizer.getSRDIconMatch("monsterfeatures");
    const compendiumMonsters = await Iconizer.getSRDIconMatch("monsters");

    // eslint-disable-next-line require-atomic-updates
    CONFIG.DDBI.SRD_LOAD.iconMap = [
      ...compendiumInventoryItems,
      ...compendiumSpellItems,
      ...compendiumFeatureItems,
      ...compendiumMonsterFeatures,
      ...compendiumMonsters,
    ];
    return CONFIG.DDBI.SRD_LOAD.iconMap;
  }

  static async copySRDIcons(items, srdImageLibrary = null, nameMatchList = []) {
    // eslint-disable-next-line require-atomic-updates
    if (!srdImageLibrary) srdImageLibrary = await Iconizer.getSRDImageLibrary();

    const srdItems = items.map((item) => {
      logger.debug(`Matching ${item.name}`);
      const nameMatch = nameMatchList.find((m) => m.name === item.name);
      if (nameMatch) {
        item.img = nameMatch.img;
      } else {
        const match = NameMatcher.looseItemNameMatch(item, srdImageLibrary, true);
        if (match) {
          srdImageLibrary.push({ name: item.name, img: match.img });
          item.img = match.img;
        }
      }
      return item;
    });
    return srdItems;
  }

  static async retainExistingIcons(items) {
    return new Promise((resolve) => {
      const newItems = items.map((item) => {
        if (item.flags.ddbimporter?.ignoreIcon) {
          logger.debug(`Retaining icon for ${item.name} to ${item.flags.ddbimporter.matchedImg}`);
          item.img = item.flags.ddbimporter.matchedImg;
        }
        return item;
      });
      resolve(newItems);
    });
  }

  static async getDDBItemImages(items, download) {
    DDBMuncher.munchNote(`Fetching DDB Item Images`);
    const downloadImages = (download) ? true : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-download-images");
    const remoteImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-remote-images");
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

    const itemMap = items.map(async (item) => {
      let itemImage = {
        name: item.name,
        type: item.type,
        img: null,
        large: null,
      };

      const pathPostfix = useDeepPaths ? `/item/${item.type}` : "";

      if (foundry.utils.hasProperty(item, "flags.ddbimporter.dndbeyond")) {
        if (item.flags.ddbimporter.dndbeyond.avatarUrl) {
          const avatarUrl = item.flags.ddbimporter.dndbeyond['avatarUrl'];
          if (avatarUrl && avatarUrl != "") {
            DDBMuncher.munchNote(`Downloading ${item.name} image`);
            const imageNamePrefix = useDeepPaths ? "" : "item";
            const downloadOptions = { type: "item", name: item.name, download: downloadImages, remoteImages, targetDirectory, pathPostfix, imageNamePrefix };
            const smallImage = await FileHelper.getImagePath(avatarUrl, downloadOptions);
            logger.debug(`Final image ${smallImage}`);
            itemImage.img = smallImage;
          }
        }
        if (item.flags.ddbimporter.dndbeyond.largeAvatarUrl) {
          const largeAvatarUrl = item.flags.ddbimporter.dndbeyond['largeAvatarUrl'];
          if (largeAvatarUrl && largeAvatarUrl != "") {
            const imageNamePrefix = useDeepPaths ? "" : "item";
            const name = useDeepPaths ? `${item.name}-large` : item.name;
            const downloadOptions = { type: "item-large", name, download: downloadImages, remoteImages, targetDirectory, pathPostfix, imageNamePrefix };
            const largeImage = await FileHelper.getImagePath(largeAvatarUrl, downloadOptions);
            itemImage.large = largeImage;
            if (!itemImage.img) itemImage.img = largeImage;
          }
        }
      }

      DDBMuncher.munchNote("");
      return itemImage;
    });

    return Promise.all(itemMap);
  }

  static async getDDBHintImages(type, items, download) {
    DDBMuncher.munchNote(`Fetching DDB Hint Images for ${type}`);
    const downloadImages = (download) ? true : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-download-images");
    const remoteImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-remote-images");
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

    const imageNamePrefix = useDeepPaths ? "" : type;

    for (const item of items) {
      // eslint-disable-next-line no-continue
      if (item.type !== type || item.img) continue;
      const ddbImg = foundry.utils.getProperty(item, "flags.ddbimporter.ddbImg");
      // eslint-disable-next-line no-continue
      if (!ddbImg || ddbImg === "") continue;
      const pathPostfix = useDeepPaths ? `/${type}/${item.type}` : "";
      const name = useDeepPaths ? `${item.name}` : item.name;
      const downloadOptions = { type, name, download: downloadImages, remoteImages, targetDirectory, pathPostfix, imageNamePrefix };
      // eslint-disable-next-line no-await-in-loop
      const img = await FileHelper.getImagePath(ddbImg, downloadOptions);
      if (img) item.img = img;
    }

    DDBMuncher.munchNote("");

    return items;
  }

  static async getDDBGenericItemImages(download) {
    DDBMuncher.munchNote(`Fetching DDB Generic Item icons`);
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    const imageNamePrefix = useDeepPaths ? "" : "item";
    const pathPostfix = useDeepPaths ? "/ddb/item" : "";

    const itemMap = DICTIONARY.items.map(async (item) => {
      const downloadOptions = { type: "item", name: item.filterType, download, targetDirectory, pathPostfix, imageNamePrefix };
      const img = await FileHelper.getImagePath(item.img, downloadOptions);
      let itemIcons = {
        filterType: item.filterType,
        img: img,
      };
      return itemIcons;
    });

    DDBMuncher.munchNote("");
    return Promise.all(itemMap);
  }


  static async getDDBGenericLootImages(download) {
    DDBMuncher.munchNote(`Fetching DDB Generic Loot icons`);
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    const imageNamePrefix = useDeepPaths ? "" : "equipment";
    const pathPostfix = useDeepPaths ? "/ddb/loot" : "";

    const itemMap = DICTIONARY.genericItemIcons.map(async (item) => {
      const downloadOptions = { type: "equipment", name: item.name, download, targetDirectory, pathPostfix, imageNamePrefix };
      const img = await FileHelper.getImagePath(item.img, downloadOptions);
      let itemIcons = {
        name: item.name,
        img: img,
      };
      return itemIcons;
    });

    DDBMuncher.munchNote("");
    return Promise.all(itemMap);
  }

  static async getDDBGenericItemIcons(items, download) {
    const genericItems = await Iconizer.getDDBGenericItemImages(download);
    const genericLoots = await Iconizer.getDDBGenericLootImages(download);

    let updatedItems = items.map((item) => {
      // logger.debug(item.name);
      // logger.debug(item.flags.ddbimporter.dndbeyond.filterType);
      const excludedItems = ["spell", "feat", "class"];
      if (!excludedItems.includes(item.type)
          && item.flags
          && item.flags.ddbimporter
          && item.flags.ddbimporter.dndbeyond) {
        let generic = null;
        if (item.flags.ddbimporter.dndbeyond.filterType) {
          generic = genericItems.find((i) => i.filterType === item.flags.ddbimporter.dndbeyond.filterType);
        } else if (item.flags.ddbimporter.dndbeyond.type) {
          generic = genericLoots.find((i) => i.name === item.flags.ddbimporter.dndbeyond.type);
        }
        if (generic && (!item.img || item.img == "" || item.img == CONST.DEFAULT_TOKEN)) {
          item.img = generic.img;
        }
      }
      return item;
    });
    return Promise.all(updatedItems);
  }

  static async getDDBSchoolSpellImages(download) {
    DDBMuncher.munchNote(`Fetching spell school icons`);
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");
    const imageNamePrefix = useDeepPaths ? "" : "spell";
    const pathPostfix = useDeepPaths ? "/spell/school" : "";

    const schoolMap = DICTIONARY.spell.schools.map(async (school) => {
      const downloadOptions = { type: "spell", name: school.name, download, targetDirectory, imageNamePrefix, pathPostfix };
      const img = await FileHelper.getImagePath(school.img, downloadOptions);
      let schoolIcons = {
        name: school.name,
        img: img,
        id: school.id,
      };
      return schoolIcons;
    });

    DDBMuncher.munchNote("");
    return Promise.all(schoolMap);
  }

  static async getDDBSpellSchoolIcons(items, download) {
    const schools = await Iconizer.getDDBSchoolSpellImages(download);

    let updatedItems = items.map((item) => {
      // logger.debug(item.name);
      // logger.debug(item.flags.ddbimporter.dndbeyond);
      if (item.type == "spell") {
        const school = schools.find((school) => school.id === item.system.school);
        if (school && (!item.img || item.img == "" || item.img == CONST.DEFAULT_TOKEN)) {
          item.img = school.img;
        }
      }
      return item;
    });
    return Promise.all(updatedItems);
  }

  static async getDDBEquipmentIcons(items, download) {
    const itemImages = await Iconizer.getDDBItemImages(items.filter((item) => DICTIONARY.types.inventory.includes(item.type)), download);

    let updatedItems = items.map((item) => {
      // logger.debug(item.name);
      // logger.debug(item.flags.ddbimporter.dndbeyond);
      if (DICTIONARY.types.inventory.includes(item.type)) {
        if (!item.img || item.img == "" || item.img == CONST.DEFAULT_TOKEN) {
          const imageMatch = itemImages.find((m) => m.name == item.name && m.type == item.type);
          if (imageMatch && imageMatch.img) {
            item.img = imageMatch.img;
            foundry.utils.setProperty(item, "flags.ddbimporter.keepIcon", true);
          }
          if (imageMatch && imageMatch.large) {
            item.flags.ddbimporter.dndbeyond['pictureUrl'] = imageMatch.large;
          }
        }
      }
      return item;
    });
    return Promise.all(updatedItems);
  }

  static async updateMagicItemImages(items) {
    const useSRDCompendiumIcons = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd-icons");
    const ddbSpellIcons = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-spell-icons");
    const inbuiltIcons = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-inbuilt-icons");
    const ddbItemIcons = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-item-icons");

    // if we still have items to add, add them
    if (items.length > 0) {
      if (ddbItemIcons) {
        logger.debug("Magic items: adding equipment icons");
        items = await Iconizer.getDDBEquipmentIcons(items, true);
      }

      if (inbuiltIcons) {
        logger.debug("Magic items: adding inbuilt icons");
        items = await Iconizer.copyInbuiltIcons(items);
      }

      if (useSRDCompendiumIcons) {
        logger.debug("Magic items: adding srd compendium icons");
        items = await Iconizer.copySRDIcons(items);
      }

      if (ddbSpellIcons) {
        logger.debug("Magic items: adding ddb spell school icons");
        items = await Iconizer.getDDBSpellSchoolIcons(items, true);
      }
    }
    return items;
  }

  static async preFetchDDBIconImages() {
    await Iconizer.getDDBGenericItemImages(true);
    await Iconizer.getDDBGenericLootImages(true);
    await Iconizer.getDDBSchoolSpellImages(true);
  }


  /**
   * Add an item to effects, if available
   * @param {*} items
   */
  static addItemEffectIcons(items) {
    logger.debug("Adding Icons to effects");
    items.forEach((item) => {
      if (item.effects && (item.img && (item.img !== "" || item.img !== CONST.DEFAULT_TOKEN))) {
        item.effects.forEach((effect) => {

          if (!effect.icon || effect.icon === "" || effect.icon === CONST.DEFAULT_TOKEN) {
            effect.icon = item.img;
          }
        });
      }

    });
    return items;
  }

  static addActorEffectIcons(actor) {
    if (!actor.effects) return actor;
    logger.debug("Adding Icons to actor effects");
    actor.effects.forEach((effect) => {
      const name = foundry.utils.getProperty(effect, "flags.ddbimporter.originName");
      if (name) {
        const actorItem = actor.items.find((i) => i.name === name);
        if (actorItem) {
          effect.icon = actorItem.img;
        }
      }
    });
    return actor;
  }

  static async updateIcons(items, srdIconUpdate = true, monster = false, monsterName = "") {
    // this will use ddb item icons as a fall back
    const ddbItemIcons = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-item-icons");
    if (ddbItemIcons) {
      logger.debug("DDB Equipment Icon Match");
      items = await Iconizer.getDDBEquipmentIcons(items);
    }

    const inBuiltIcons = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-inbuilt-icons");
    if (inBuiltIcons) {
      items = await Iconizer.getDDBHintImages("class", items);
      items = await Iconizer.getDDBHintImages("subclass", items);
      logger.debug(`Inbuilt icon matching (Monster? ${monster ? monsterName : monster})`);
      items = await Iconizer.copyInbuiltIcons(items, monster, monsterName);
    }

    // check for SRD icons
    const srdIcons = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-icons");
    // eslint-disable-next-line require-atomic-updates
    if (srdIcons && srdIconUpdate) {
      logger.debug("SRD Icon Matching");
      items = await Iconizer.copySRDIcons(items);
    }

    // this will use ddb spell school icons as a fall back
    const ddbSpellIcons = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-spell-icons");
    if (ddbSpellIcons) {
      logger.debug("DDB Spell School Icon Match");
      items = await Iconizer.getDDBSpellSchoolIcons(items, true);
    }

    // this will use ddb generic icons as a fall back
    const ddbGenericItemIcons = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-generic-item-icons");
    if (ddbGenericItemIcons) {
      logger.debug("DDB Generic Item Icon Match");
      items = await Iconizer.getDDBGenericItemIcons(items, true);
    }

    // update any generated effects
    const addEffects = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-effects");
    if (addEffects) {
      items = Iconizer.addItemEffectIcons(items);
    }

    return items;
  }


}
