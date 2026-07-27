import { DICTIONARY, SETTINGS } from "../config/_module";
import logger from "./Logger";
import utils from "./Utils";
import CompendiumHelper from "./CompendiumHelper";
import FileHelper from "./FileHelper";
import NameMatcher from "./NameMatcher";
import AdventureMunchHelpers from "../muncher/adventure/AdventureMunchHelpers";

// const BASE_PATH = ROUTE_PREFIX ? `/${ROUTE_PREFIX}` : "";

const TYPE_MAP: Record<string, string> = {
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
  vehicle: "vehicle",
  character: "character",
  npc: "npc",
  table: "table",
  rolltable: "table",
  journal: "journal",
  macro: "macro",
  undefined: "null",
  null: "null",
};

const FILE_MAP: Record<string, string[]> = {
  null: [],
  character: [],
  npc: [],
  vehicle: [],
  table: [],
  macro: [],
  journal: [],
  items: ["items.json", "class-features.json", "races.json"],
  traits: ["class-features.json", "races.json", "general.json", "items.json"],
  spells: ["spells.json"],
  races: ["races.json"],
  feats: ["feats.json", "class-features.json", "races.json", "general.json"],
  classes: ["classes.json"],
  monster: ["named-monster-features.json", "generic-monster-features.json", "spells.json", "items.json", "general.json"],
  backgrounds: ["backgrounds.json", "feats.json", "class-features.json", "races.json", "general.json"],
};

const ICON_MAP_INDICIES = ["name", "img", "prototypeToken.texture.src", "type", "prototypeToken.texture.scaleY", "prototypeToken.texture.scaleX"];

function sanitiseName(name: string): string {
  return utils.nameString(name).toLowerCase();
}

async function loadDataFile(fileName: string): Promise<IIconizerMapEntry[]> {
  logger.debug(`Getting icon mapping for ${fileName}`);
  const fileExists = await FileHelper.fileExists("[data] modules/ddb-importer/data", fileName);

  const url = await FileHelper.getFileUrl("[data] modules/ddb-importer/data", fileName);
  if (!fileExists) {
    logger.warn(`Possible missing file, icon load may fail. Fetching ${url}`);
  }

  const data = await foundry.utils.fetchJsonWithTimeout(url);
  return data as IIconizerMapEntry[];
}

async function loadIconMap(type: string) {
  // check to see if dictionary is loaded
  if (CONFIG.DDBI.ICONS[type]) return;

  logger.debug(`Loading Inbuilt Icon Map for ${type}`);
  let data: IIconizerMapEntry[] = [];
  for (const fileName of FILE_MAP[type]) {
    const dataLoad: IIconizerMapEntry[] = await loadDataFile(fileName);
    data = data.concat(dataLoad);
  }

  CONFIG.DDBI.ICONS[type] = data;
  // console.warn(iconMap);
}

function looseMatch(item: TDDBItemImporterDocument, typeValue: string) {
  const originalName = foundry.utils.getProperty(item, "flags.ddbimporter.originalName") as string | undefined;
  if (originalName) {
    const originalMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitiseName(entry.name) === sanitiseName(originalName));
    if (originalMatch) return originalMatch.path;
  }

  if (!item.name) return null;
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

  if (item.type === "subclass" && "system" in item && "classIdentifier" in item.system && item.system.classIdentifier) {
    const sanitisedClassName = sanitiseName(item.system.classIdentifier);
    const subClassMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => sanitiseName(entry.name).startsWith(sanitisedClassName));
    if (subClassMatch) return subClassMatch.path;
  }

  return null;
}

function getIconPath(item: TDDBItemImporterDocument, type: string, monsterName = ""): string | null {
  // check to see if we are able to load a dic for that type
  const typeValue = TYPE_MAP[type];
  if (!typeValue || !CONFIG.DDBI.ICONS[typeValue]) return null;

  const itemName = item.name;
  if (!itemName) return null;

  const iconMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => {
    const sanitisedName = sanitiseName(entry.name);
    const sanitisedItemName = sanitiseName(itemName);
    if (type === "monster") {
      return sanitisedName === sanitisedItemName.split("(")[0].trim()
        && entry.monster && sanitiseName(entry.monster) == sanitiseName(monsterName);
    }
    return sanitisedName === sanitisedItemName;
  });

  if (!iconMatch && type === "monster") {
    const genericMonsterIconMatch = CONFIG.DDBI.ICONS[typeValue]
      .filter((entry) => !entry.monster)
      .find((entry) => {
        const sanitisedName = sanitiseName(entry.name);
        const sanitisedItemName = sanitiseName(itemName);
        return sanitisedName === sanitisedItemName;
      });
    if (genericMonsterIconMatch) return genericMonsterIconMatch.path;

    const anyMonsterIconMatch = CONFIG.DDBI.ICONS[typeValue].find((entry) => {
      const sanitisedName = sanitiseName(entry.name);
      const sanitisedItemName = sanitiseName(itemName);
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


async function loadIconMaps(types: string[]) {
  const promises: Promise<any>[] = [];

  const mapTypes = types
    .filter((type) => TYPE_MAP[type as keyof typeof TYPE_MAP])
    .map((type) => TYPE_MAP[type as keyof typeof TYPE_MAP])
    .filter((type, i, ar) => ar.indexOf(type) === i);

  mapTypes.forEach((type) => {
    // logger.debug(`Loading ${type}`);
    promises.push(loadIconMap(type));
  });

  await Promise.all(promises);
}

const STUBS: Record<number, string> = {
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

function unPad(_match: string, p1: string) {
  if (isNaN(parseInt(p1))) {
    return p1;
  } else {
    return String(parseInt(p1));
  }
}

interface IIconizerSettings {
  ddbItem?: boolean;
  inBuilt?: boolean;
  srdIcons?: boolean;
  ddbSpell?: boolean;
  ddbGenericItem?: boolean;
  excludeCheck?: boolean;
}

export default class Iconizer {
  documents: TDDBItemImporterDocument[];
  notifier: NotifierV1;
  isMonster: boolean;
  monsterName: string;
  srdIconUpdate: boolean;
  settings: IIconizerSettings;

  static SETTINGS(): IIconizerSettings {
    return {
      ddbItem: utils.getSetting<boolean>("munching-policy-use-ddb-item-icons"),
      inBuilt: utils.getSetting<boolean>("munching-policy-use-inbuilt-icons"),
      srdIcons: utils.getSetting<boolean>("munching-policy-use-srd-icons"),
      ddbSpell: utils.getSetting<boolean>("munching-policy-use-ddb-spell-icons"),
      ddbGenericItem: utils.getSetting<boolean>("munching-policy-use-ddb-generic-item-icons"),
      excludeCheck: true,
    };
  }

  constructor({
    notifier = null, settings = {}, documents = [],
    srdIconUpdate = true, isMonster = false, monsterName = "",
  }:
  {
    notifier?: NotifierV1 | null;
    settings?: IIconizerSettings;
    documents?: TDDBItemImporterDocument[];
    srdIconUpdate?: boolean;
    isMonster?: boolean;
    monsterName?: string;
  } = {}) {
    this.notifier = notifier ?? ((note, { nameField = false, monsterNote = false } = {}) => {
      logger.info(note, { nameField, monsterNote });
    });
    this.settings = foundry.utils.mergeObject(Iconizer.SETTINGS(), settings);
    this.documents = documents;
    this.isMonster = isMonster;
    this.monsterName = monsterName;
    this.srdIconUpdate = srdIconUpdate;
  }

  async _addDDBEquipmentIcons() {
    const targetDocs = this.documents.filter((item) => DICTIONARY.types.inventory.includes(item.type ?? ""));
    const itemImages = await Iconizer.getDDBItemImages(targetDocs, true);

    this.documents = await Promise.all(this.documents.map((doc: TDDBItemImporterDocument) => {
      // logger.debug(doc.name);
      // logger.debug(doc.flags.ddbimporter.dndbeyond);
      if (foundry.utils.getProperty(doc, "flags.ddbimporter.keepIcon") === true) return doc;
      if (DICTIONARY.types.inventory.includes(doc.type ?? "")) {
        // the runtime inventory type guard above narrows doc to an inventory item
        const item = doc as I5eInventoryItem;
        if (utils.isDefaultOrPlaceholderImage(item.img)) {
          const imageMatch = itemImages.find((m) => m.name == item.name && m.type == item.type);
          if (imageMatch && imageMatch.img) {
            item.img = imageMatch.img;
            foundry.utils.setProperty(item, "flags.ddbimporter.keepIcon", true);
          }
          if (imageMatch && imageMatch.large && item.flags?.ddbimporter?.dndbeyond) {
            item.flags.ddbimporter.dndbeyond.pictureUrl = imageMatch.large;
          }
        }
      }
      return doc;
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

  static async generateIcon(adventureName: string, title: string) {
    // default path
    let iconPath = "icons/svg/book.svg";
    let stub = title.trim().split(".")[0].split(" ")[0];
    stub = stub.replace(/(\d+)/, unPad);
    // eslint-disable-next-line no-control-regex
    stub = stub.replace(/[<>:"/\\|?*\x00-\x1F]/g, ""); // drop chars illegal in file paths
    if (stub.length <= 4) {
      iconPath = `assets/icons/${stub}.svg`;
      logger.info(stub);
      let content = STUBS[stub.length];
      content = content.replace("REPLACEME", stub);
      const uploadPath = await AdventureMunchHelpers.importRawFile({ adventureName, path: iconPath, content, mimeType: "text/plain", misc: true });
      return uploadPath;
    }
    return iconPath;
  }

  static async iconPath(item: TAll5eDocuments, monster = false, monsterName = "") {
    const itemTypes: string[] = [item.type];
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
    // indexing TYPE_MAP with undefined stringifies to the "undefined" key, keep that behaviour
    const itemTypes: string[] = this.documents.map((item) => item.type ?? "undefined").filter((item, i, ar) => ar.indexOf(item) === i);

    if (this.isMonster) itemTypes.push("monster");
    await loadIconMaps(itemTypes);

    this.documents = this.documents.map((item) => {
      if (foundry.utils.getProperty(item, "flags.ddbimporter.keepIcon") === true) return item;
      // logger.debug(`Inbuilt icon match started for ${item.name} [${item.type}]`);
      // if we have a monster lets check the monster dict first
      if (this.isMonster && !["spell"].includes(item.type ?? "")) {
        const monsterPath = getIconPath(item, "monster", this.monsterName);
        if (monsterPath) {
          item.img = monsterPath;
          return item;
        }
      }
      const pathMatched = getIconPath(item, item.type ?? "undefined");
      if (pathMatched) {
        item.img = pathMatched;
        if ("effects" in item && Array.isArray(item.effects)) {
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

  static async getSRDIconMatch(type: string, version: T5eRulesVersion = "2014"): Promise<ICompendiumIconMapEntry[]> {
    const compendiumEntry = SETTINGS.SRD_COMPENDIUMS[version].find((c) => c.type == type);
    if (!compendiumEntry) return [];
    const srdPack = CompendiumHelper.getCompendium(compendiumEntry.name, false);
    if (!srdPack) return [];
    const index = await srdPack.getIndex({ fields: ICON_MAP_INDICIES });
    return index as unknown as ICompendiumIconMapEntry[];
  }

  static async getOfficialIconMatch(type: string): Promise<ICompendiumIconMapEntry[]> {
    const indexes: ICompendiumIconMapEntry[] = [];
    for (const bookKey of Object.keys(SETTINGS.FOUNDRY_COMPENDIUMS)) {
      const compendiumName = SETTINGS.FOUNDRY_COMPENDIUMS[bookKey].find((c) => c.type == type)?.name;
      if (!compendiumName) continue;
      const officialPack = CompendiumHelper.getCompendium(compendiumName, false);
      if (!officialPack) continue;
      const index = await officialPack.getIndex({ fields: ICON_MAP_INDICIES });
      indexes.push(...(index as unknown as ICompendiumIconMapEntry[]));
    }

    return Array.from(new Set(indexes)) as unknown as ICompendiumIconMapEntry[];
  }

  static async getSRDImageLibrary(version: T5eRulesVersion = "2014"): Promise<ICompendiumIconMapEntry[]> {
    const mapLoaded = foundry.utils.getProperty(CONFIG.DDBI, `SRD_LOAD.mapLoaded.${version}`) as boolean;
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

  async _copySRDIcons(srdImageLibrary: ICompendiumIconMapEntry[] | null = null, nameMatchList: Record<string, any>[] = []) {
    this.documents = await Iconizer.copySRDIcons(this.documents, srdImageLibrary, nameMatchList);
  }

  static async copySRDIcons(items: TDDBItemImporterDocument[], srdImageLibrary: ICompendiumIconMapEntry[] | null = null, nameMatchList: Record<string, any>[] = []) {
    let srdImageLibrary2014 = null;
    if (!srdImageLibrary) srdImageLibrary2014 = await Iconizer.getSRDImageLibrary("2014");
    let srdImageLibrary2024 = null;
    if (!srdImageLibrary) srdImageLibrary2024 = await Iconizer.getSRDImageLibrary("2024");

    const srdItems = items.map((item) => {
      logger.debug(`Matching ${item.name}`);
      const nameMatch = nameMatchList.find((m) => m.name === item.name);
      if (nameMatch) {
        item.img = nameMatch.img;
      } else if (item.type !== "rolltable") {
        const systemSource = foundry.utils.getProperty(item, "system.source.rules") as string;
        const localLibrary = srdImageLibrary ?? (systemSource === "2014" ? srdImageLibrary2014 : srdImageLibrary2024) ?? [];
        const match = NameMatcher.looseItemNameMatch(item as TAll5eDocuments, localLibrary, true);
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
      const matchedImg = foundry.utils.getProperty(item, "flags.ddbimporter.matchedImg") as string | undefined;
      if (foundry.utils.getProperty(item, "flags.ddbimporter.keepIcon") && matchedImg) {
        logger.debug(`Retaining icon for ${item.name} to ${matchedImg}`);
        item.img = matchedImg;
      }
      return item;
    });
  }

  static async getDDBItemImages(items: TDDBItemImporterDocument[], download: boolean) {
    utils.munchNote(`Fetching DDB Item Images`, { nameField: true });
    const downloadImages = (download) ? true : utils.getSetting<boolean>("munching-policy-download-images");
    const remoteImages = utils.getSetting<boolean>("munching-policy-remote-images");
    const targetDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = utils.getSetting<boolean>("use-deep-file-paths");

    const itemMap = items.map(async (item) => {
      const itemImage = {
        name: item.name,
        type: item.type,
        img: null as string | null,
        large: null as string | null,
      };

      const rules = foundry.utils.getProperty(item, "system.source.rules") as string ?? "2024";
      const book = utils.normalizeString(foundry.utils.getProperty(item, "system.source.book") as string ?? "");
      const bookRuleStub = [rules, book].join("-");

      const pathPostfix = useDeepPaths ? `/item/${item.type}` : "";

      const dndbeyondFlags = foundry.utils.getProperty(item, "flags.ddbimporter.dndbeyond") as IDDBImporterFlagsDnDBeyond | undefined;
      if (dndbeyondFlags) {
        if (dndbeyondFlags.avatarUrl) {
          const avatarUrl = dndbeyondFlags["avatarUrl"];
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
        if (dndbeyondFlags.largeAvatarUrl) {
          const largeAvatarUrl = dndbeyondFlags["largeAvatarUrl"];
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

  async _addDDBHintImages(type: string) {
    this.notifier(`Fetching DDB Hint Images for ${type}`, { nameField: true });
    const targetDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = utils.getSetting<boolean>("use-deep-file-paths");

    for (const item of this.documents) {

      if (item.type !== type || item.img) continue;
      const ddbImg = foundry.utils.getProperty(item, "flags.ddbimporter.ddbImg") as string | undefined;

      if (!ddbImg || ddbImg === "") continue;
      const pathPostfix = useDeepPaths ? `/${type}/${item.type}` : "";
      const rules = (foundry.utils.getProperty(item, "system.source.rules") as string) ?? "2024";
      const book = utils.normalizeString((foundry.utils.getProperty(item, "system.source.book") as string) ?? "");
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
    const targetDirectory = utils.getSetting<string>("persistent-storage-location").replace(/^\/|\/$/g, "");
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
      const itemIcons = {
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
    const targetDirectory = utils.getSetting<string>("persistent-storage-location").replace(/^\/|\/$/g, "");
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
      const itemIcons = {
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
      if (!excludedItems.includes(item.type ?? "")
          && item.flags
          && item.flags.ddbimporter
          && item.flags.ddbimporter.dndbeyond) {
        let generic = null;
        const filterType = foundry.utils.getProperty(item, "flags.ddbimporter.dndbeyond.filterType") as string | undefined;
        const ddbType = foundry.utils.getProperty(item, "flags.ddbimporter.dndbeyond.type") as string | undefined;
        if (filterType) {
          generic = genericItems.find((i) => i.filterType === filterType);
        } else if (ddbType) {
          generic = genericLoots.find((i) => i.name === ddbType);
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
    const targetDirectory = utils.getSetting<string>("persistent-storage-location").replace(/^\/|\/$/g, "");
    const pathPostfix = "/spell/school";

    const schoolMap = DICTIONARY.spell.schools.map(async (school) => {
      const downloadOptions = { type: "spell", name: school.name, download: true, targetDirectory, pathPostfix };
      const img = await FileHelper.getImagePath(school.img, downloadOptions);
      const schoolIcons = {
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
      if (item.type == "spell" && "system" in item && "school" in item.system) {
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
      if ("effects" in item && Array.isArray(item.effects) && (item.img && (item.img !== "" || item.img !== CONST.DEFAULT_TOKEN as string))) {
        item.effects.forEach((effect) => {
          if (utils.isDefaultOrPlaceholderImage(effect.img)) {
            effect.img = item.img;
          }
        });
      }
    });
  }

  static addActorEffectIcons<T extends TAll5eActorDocuments>(actor: T): T {
    if (!actor.effects) return actor;
    logger.debug("Adding Icons to actor effects");
    actor.effects.forEach((effect) => {
      const name = foundry.utils.getProperty(effect, "flags.ddbimporter.originName");
      if (name) {
        const actorItem = actor.items?.find((i) => i.name === name);
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
  }: {
    documents: TDDBItemImporterDocument[];
    srdIconUpdate?: boolean;
    monster?: boolean;
    monsterName?: string;
    notifier?: NotifierV1 | null;
    settings?: IIconizerSettings;
    preFetch?: boolean;
  }) {
    if (preFetch) await Iconizer.preFetchDDBIconImages();
    const iconzier = new Iconizer({ notifier, documents, srdIconUpdate, isMonster: monster, monsterName, settings });
    await iconzier.processDocuments();
    return iconzier.documents;
  }

}
