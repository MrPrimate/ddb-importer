import { DICTIONARY, SETTINGS } from "../config/_module.mjs";
import { logger, utils, CompendiumHelper, FileHelper, NameMatcher } from "./_module.mjs";

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
  summons: "monster",
  summon: "monster",
  backgrounds: "backgrounds",
  background: "backgrounds",
  traits: "traits",
  races: "races",
  race: "races",
  tattoo: "items",
  "dnd-tashas-cauldron.tattoo": "items",
};

const FILE_MAP = {
  items: ["items.json", "class-features.json", "races.json"],
  traits: ["class-features.json", "races.json", "general.json", "items.json"],
  spells: ["spells.json"],
  races: ["races.json"],
  feats: ["feats.json", "class-features.json", "races.json", "general.json"],
  classes: ["classes.json"],
  monster: ["named-monster-features.json", "generic-monster-features.json", "spells.json", "items.json", "general.json"],
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
    const genericMonsterIconMatch = CONFIG.DDBI.ICONS[typeValue]
      .filter((entry) => !entry.monster)
      .find((entry) => {
        const sanitisedName = sanitiseName(entry.name);
        const sanitisedItemName = sanitiseName(item.name);
        return sanitisedName === sanitisedItemName;
      });
    if (genericMonsterIconMatch) return genericMonsterIconMatch.path;

    const anyMonsterIconMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => {
      const sanitisedName = sanitiseName(entry.name);
      const sanitisedItemName = sanitiseName(item.name);
      return sanitisedName === sanitisedItemName;
    });
    if (anyMonsterIconMatch) return anyMonsterIconMatch.path;
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

  static SETTINGS() {
    return {
      ddbItem: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-item-icons"),
      inBuilt: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-inbuilt-icons"),
      srdIcons: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-icons"),
      ddbSpell: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-spell-icons"),
      ddbGenericItem: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-generic-item-icons"),
      excludeCheck: true,
    };
  }

  constructor({
    notifier = null, settings = {}, documents = [],
    srdIconUpdate = true, isMonster = false, monsterName = "",
  } = {}) {
    this.notifier = notifier;
    if (!notifier) {
      this.notifier = (note, { nameField = false, monsterNote = false } = {}) => {
        logger.info(note, { nameField, monsterNote });
      };
    }
    this.settings = foundry.utils.mergeObject(Iconizer.SETTINGS(), settings);
    this.documents = documents;
    this.isMonster = isMonster;
    this.monsterName = monsterName;
    this.srdIconUpdate = srdIconUpdate;
  }

  async _addDDBEquipmentIcons() {
    const targetDocs = this.documents.filter((item) => DICTIONARY.types.inventory.includes(item.type));
    const itemImages = await Iconizer.getDDBItemImages(targetDocs, true);

    this.documents = await Promise.all(this.documents.map((item) => {
      // logger.debug(item.name);
      // logger.debug(item.flags.ddbimporter.dndbeyond);
      if (foundry.utils.getProperty(item, "flags.ddbimporter.keepIcon") === true) return item;
      if (DICTIONARY.types.inventory.includes(item.type)) {
        if (utils.isDefaultOrPlaceholderImage(item.img)) {
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
    }));
  }

  async processDocuments() {

    // this will use ddb item icons as a fall back
    if (this.settings.ddbItem) {
      logger.debug("DDB Equipment Icon Match");
      await this._addDDBEquipmentIcons();
    }

    if (this.settings.inBuilt) {
      for (const type of DICTIONARY.types.full)
        await this._addDDBHintImages(type);
      logger.debug(`Inbuilt icon matching (Monster? ${this.isMonster ? this.monsterName : this.isMonster})`);
      await this._copyInbuiltIcons();
    }

    // check for SRD icons
    if (this.settings.srdIcons && this.srdIconUpdate) {
      logger.debug("SRD Icon Matching");
      await this._copySRDIcons();
    }

    // this will use ddb spell school icons as a fall back
    if (this.settings.ddbSpell) {
      logger.debug("DDB Spell School Icon Match");
      await this._addDDBSpellSchoolIcons();
    }

    // this will use ddb generic icons as a fall back
    if (this.settings.ddbGenericItem) {
      logger.debug("DDB Generic Item Icon Match");
      await this._addDDBGenericItemIcons();
    }

    // update any generated effects
    this._addItemEffectIcons();
    this._retainExistingIcons();
  }

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

  async _copyInbuiltIcons() {
    // get unique array of item types to be matching
    const itemTypes = this.documents.map((item) => item.type).filter((item, i, ar) => ar.indexOf(item) === i);

    if (this.isMonster) itemTypes.push("monster");
    await loadIconMaps(itemTypes);

    this.documents = this.documents.map((item) => {
      if (foundry.utils.getProperty(item, "flags.ddbimporter.keepIcon") === true) return item;
      // logger.debug(`Inbuilt icon match started for ${item.name} [${item.type}]`);
      // if we have a monster lets check the monster dict first
      if (this.isMonster && !["spell"].includes(item.type)) {
        const monsterPath = getIconPath(item, "monster", this.monsterName);
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
            if (!effect.img || effect.img === "") {
              effect.img = pathMatched;
            }
          });
        }
      }
      return item;
    });
  }

  static async getSRDIconMatch(type, version = "2014") {
    const compendiumName = SETTINGS.SRD_COMPENDIUMS[version].find((c) => c.type == type).name;
    const srdPack = CompendiumHelper.getCompendium(compendiumName, false);
    if (!srdPack) return [];
    const srdIndices = ["name", "img", "prototypeToken.texture.src", "type", "prototypeToken.texture.scaleY", "prototypeToken.texture.scaleX"];
    const index = await srdPack.getIndex({ fields: srdIndices });
    return index;
  }

  static async getOfficialIconMatch(type) {
    const indexes = [];
    for (const bookKey of Object.keys(SETTINGS.FOUNDRY_COMPENDIUMS)) {
      const compendiumName = SETTINGS.FOUNDRY_COMPENDIUMS[bookKey].find((c) => c.type == type)?.name;
      if (!compendiumName) continue;
      const officialPack = CompendiumHelper.getCompendium(compendiumName, false);
      if (!officialPack) continue;
      const indices = ["name", "img", "prototypeToken.texture.src", "type", "prototypeToken.texture.scaleY", "prototypeToken.texture.scaleX"];
      const index = await officialPack.getIndex({ fields: indices });
      indexes.push(...index);
    }

    return Array.from(new Set(indexes));
  }

  static async getSRDImageLibrary(version = "2014") {
    const mapLoaded = foundry.utils.getProperty(CONFIG.DDBI, `SRD_LOAD.mapLoaded.${version}`);
    if (mapLoaded) return CONFIG.DDBI.SRD_LOAD.iconMap[version];
    const officialFeatureItems = await Iconizer.getOfficialIconMatch("features");
    const officialOriginItems = await Iconizer.getOfficialIconMatch("backgrounds");
    const officialFeatItems = await Iconizer.getOfficialIconMatch("feats");
    const officialInventoryItems = await Iconizer.getOfficialIconMatch("inventory");
    const officialSpellItems = await Iconizer.getOfficialIconMatch("spells");
    const officialMonsterFeatures = await Iconizer.getOfficialIconMatch("monsterfeatures");
    const officialMonsters = await Iconizer.getOfficialIconMatch("monsters");

    const srdFeatureItems = await Iconizer.getSRDIconMatch("features", version);
    const srdInventoryItems = await Iconizer.getSRDIconMatch("inventory", version);
    const srdSpellItems = await Iconizer.getSRDIconMatch("spells", version);
    const srdMonsterFeatures = await Iconizer.getSRDIconMatch("monsterfeatures", version);
    const srdMonsters = await Iconizer.getSRDIconMatch("monsters", version);

    // eslint-disable-next-line require-atomic-updates
    foundry.utils.setProperty(CONFIG.DDBI, `SRD_LOAD.iconMap.${version}`, [
      ...officialFeatureItems,
      ...officialOriginItems,
      ...officialFeatItems,
      ...officialInventoryItems,
      ...officialSpellItems,
      ...officialMonsterFeatures,
      ...officialMonsters,
      ...srdInventoryItems,
      ...srdSpellItems,
      ...srdFeatureItems,
      ...srdMonsterFeatures,
      ...srdMonsters,
    ]);
    foundry.utils.setProperty(CONFIG.DDBI, `SRD_LOAD.mapLoaded.${version}`, true);
    return CONFIG.DDBI.SRD_LOAD.iconMap[version];
  }

  async _copySRDIcons(srdImageLibrary = null, nameMatchList = []) {
    this.documents = await Iconizer.copySRDIcons(this.documents, srdImageLibrary, nameMatchList);
  }

  static async copySRDIcons(items, srdImageLibrary = null, nameMatchList = []) {
    let srdImageLibrary2014 = null;
    if (!srdImageLibrary) srdImageLibrary2014 = await Iconizer.getSRDImageLibrary("2014");
    let srdImageLibrary2024 = null;
    if (!srdImageLibrary) srdImageLibrary2024 = await Iconizer.getSRDImageLibrary("2024");

    const srdItems = items.map((item) => {
      logger.debug(`Matching ${item.name}`);
      const nameMatch = nameMatchList.find((m) => m.name === item.name);
      if (nameMatch) {
        item.img = nameMatch.img;
      } else {
        const localLibrary = srdImageLibrary || (item.system.source?.rules === "2014" ? srdImageLibrary2014 : srdImageLibrary2024);
        const match = NameMatcher.looseItemNameMatch(item, localLibrary, true);
        if (match) {
          item.img = match.img;
        }
      }
      return item;
    });
    return srdItems;
  }

  _retainExistingIcons() {
    this.documents.map((item) => {
      if (foundry.utils.getProperty(item, "flags.ddbimporter.keepIcon") && foundry.utils.hasProperty(item, "flags.ddbimporter.matchedImg")) {
        logger.debug(`Retaining icon for ${item.name} to ${item.flags.ddbimporter.matchedImg}`);
        item.img = item.flags.ddbimporter.matchedImg;
      }
      return item;
    });
  }

  static async getDDBItemImages(items, download) {
    utils.munchNote(`Fetching DDB Item Images`, { nameField: true });
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

      const rules = item.system.source?.rules ?? "2024";
      const book = utils.normalizeString(item.system.source?.book ?? "");
      const bookRuleStub = [rules, book].join("-");

      const pathPostfix = useDeepPaths ? `/item/${item.type}` : "";

      if (foundry.utils.hasProperty(item, "flags.ddbimporter.dndbeyond")) {
        if (item.flags.ddbimporter.dndbeyond.avatarUrl) {
          const avatarUrl = item.flags.ddbimporter.dndbeyond['avatarUrl'];
          if (avatarUrl && avatarUrl != "") {
            utils.munchNote(`Downloading ${item.name} image`, { nameField: true });
            const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-item`;
            const downloadOptions = {
              type: "item",
              name: item.name,
              download: downloadImages,
              remoteImages,
              targetDirectory,
              pathPostfix,
              imageNamePrefix,
            };
            const smallImage = await FileHelper.getImagePath(avatarUrl, downloadOptions);
            // logger.debug(`Final image ${smallImage}`);
            itemImage.img = smallImage;
          }
        }
        if (item.flags.ddbimporter.dndbeyond.largeAvatarUrl) {
          const largeAvatarUrl = item.flags.ddbimporter.dndbeyond['largeAvatarUrl'];
          if (largeAvatarUrl && largeAvatarUrl != "") {
            const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-item`;
            const name = useDeepPaths ? `${item.name}-large` : item.name;
            const downloadOptions = {
              type: "item-large",
              name,
              download: downloadImages,
              remoteImages,
              targetDirectory,
              pathPostfix,
              imageNamePrefix,
            };
            const largeImage = await FileHelper.getImagePath(largeAvatarUrl, downloadOptions);
            itemImage.large = largeImage;
            if (!itemImage.img) itemImage.img = largeImage;
          }
        }
      }

      utils.munchNote("", { nameField: true });
      return itemImage;
    });

    return Promise.all(itemMap);
  }

  async _addDDBHintImages(type) {
    this.notifier(`Fetching DDB Hint Images for ${type}`, { nameField: true });
    // const downloadImages = (download) ? true : game.settings.get(SETTINGS.MODULE_ID, "munching-policy-download-images");
    // const remoteImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-remote-images");
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

    for (const item of this.documents) {
      // eslint-disable-next-line no-continue
      if (item.type !== type || item.img) continue;
      const ddbImg = foundry.utils.getProperty(item, "flags.ddbimporter.ddbImg");
      // eslint-disable-next-line no-continue
      if (!ddbImg || ddbImg === "") continue;
      const pathPostfix = useDeepPaths ? `/${type}/${item.type}` : "";
      const rules = item.system.source?.rules ?? "2024";
      const book = utils.normalizeString(item.system.source?.book ?? "");
      const bookRuleStub = [rules, book].join("-");
      const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-${type}`;
      const name = useDeepPaths ? `${item.name}` : item.name;
      const downloadOptions = {
        type,
        name,
        download: true,
        remoteImages: false,
        targetDirectory,
        pathPostfix,
        imageNamePrefix,
      };
      const img = await FileHelper.getImagePath(ddbImg, downloadOptions);
      if (img) item.img = img;
    }

    this.notifier("", { nameField: true });

  }

  static async getDDBGenericItemImages() {
    utils.munchNote(`Fetching DDB Generic Item icons`, { nameField: true });
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "persistent-storage-location").replace(/^\/|\/$/g, "");
    const pathPostfix = "/ddb/item";

    const itemMap = DICTIONARY.items.map(async (item) => {
      const downloadOptions = {
        type: "item",
        name: item.filterType,
        download: true,
        targetDirectory,
        pathPostfix,
      };
      const img = await FileHelper.getImagePath(item.img, downloadOptions);
      let itemIcons = {
        filterType: item.filterType,
        img: img,
      };
      return itemIcons;
    });

    utils.munchNote("", { nameField: true });
    return Promise.all(itemMap);
  }


  static async getDDBGenericLootImages() {
    utils.munchNote(`Fetching DDB Generic Loot icons`, { nameField: true });
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "persistent-storage-location").replace(/^\/|\/$/g, "");
    const pathPostfix = "/ddb/loot";

    const itemMap = DICTIONARY.genericItemIcons.map(async (item) => {
      const downloadOptions = {
        type: "equipment",
        name: item.name,
        download: true,
        targetDirectory,
        pathPostfix,
      };
      const img = await FileHelper.getImagePath(item.img, downloadOptions);
      let itemIcons = {
        name: item.name,
        img: img,
      };
      return itemIcons;
    });

    utils.munchNote("", { nameField: true });
    return Promise.all(itemMap);
  }

  async _addDDBGenericItemIcons() {
    const genericItems = await Iconizer.getDDBGenericItemImages();
    const genericLoots = await Iconizer.getDDBGenericLootImages();

    this.documents = this.documents.map((item) => {
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
        if (generic && utils.isDefaultOrPlaceholderImage(item.img)) {
          item.img = generic.img;
        }
      }
      return item;
    });
  }

  static async getDDBSchoolSpellImages() {
    utils.munchNote(`Fetching spell school icons`, { nameField: true });
    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "persistent-storage-location").replace(/^\/|\/$/g, "");
    const pathPostfix = "/spell/school";

    const schoolMap = DICTIONARY.spell.schools.map(async (school) => {
      const downloadOptions = { type: "spell", name: school.name, download: true, targetDirectory, pathPostfix };
      const img = await FileHelper.getImagePath(school.img, downloadOptions);
      let schoolIcons = {
        name: school.name,
        img: img,
        id: school.id,
      };
      return schoolIcons;
    });

    utils.munchNote("", { nameField: true });
    return Promise.all(schoolMap);
  }

  async _addDDBSpellSchoolIcons() {
    const schools = await Iconizer.getDDBSchoolSpellImages();

    this.documents = this.documents.map((item) => {
      // logger.debug(item.name);
      // logger.debug(item.flags.ddbimporter.dndbeyond);
      if (item.type == "spell") {
        const school = schools.find((school) => school.id === item.system.school);
        if (school && utils.isDefaultOrPlaceholderImage(item.img)) {
          item.img = school.img;
        }
      }
      return item;
    });
  }


  static async preFetchDDBIconImages() {
    await Iconizer.getDDBGenericItemImages();
    await Iconizer.getDDBGenericLootImages();
    await Iconizer.getDDBSchoolSpellImages();
  }


  _addItemEffectIcons() {
    logger.debug("Adding Icons to effects");
    this.documents.forEach((item) => {
      if (item.effects && (item.img && (item.img !== "" || item.img !== CONST.DEFAULT_TOKEN))) {
        item.effects.forEach((effect) => {
          if (utils.isDefaultOrPlaceholderImage(effect.img)) {
            effect.img = item.img;
          }
        });
      }
    });
  }

  static addActorEffectIcons(actor) {
    if (!actor.effects) return actor;
    logger.debug("Adding Icons to actor effects");
    actor.effects.forEach((effect) => {
      const name = foundry.utils.getProperty(effect, "flags.ddbimporter.originName");
      if (name) {
        const actorItem = actor.items.find((i) => i.name === name);
        if (actorItem) {
          effect.img = actorItem.img;
        }
      }
    });
    return actor;
  }

  static async updateIcons({
    documents = [], srdIconUpdate = true, monster = false, monsterName = "", notifier = null, settings = {},
    preFetch = false,
  } = {}) {
    if (preFetch) await Iconizer.preFetchDDBIconImages();
    const iconzier = new Iconizer({ notifier, documents, srdIconUpdate, isMonster: monster, monsterName, settings });
    await iconzier.processDocuments();
    return iconzier.documents;
  }

}
