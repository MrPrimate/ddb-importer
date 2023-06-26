import logger from "../logger.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import FileHelper from "../lib/FileHelper.js";
import { updateIcons, addActorEffectIcons, getCompendiumItems, getSRDImageLibrary, copySRDIcons, compendiumFoldersV10, addCompendiumFolderIds } from "./import.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import { migrateItemsDAESRD } from "./dae.js";
import SETTINGS from "../settings.js";
import utils from "../lib/utils.js";

// check items to see if retaining item, img or resources
async function existingItemRetentionCheck(currentItems, newItems, checkId = true) {
  const returnItems = [];

  await newItems.forEach((item) => {
    const existingItem = currentItems.find((owned) => {
      const simpleMatch
        = item.name === owned.name
        && item.type === owned.type
        && item.system.activation?.type === owned.system.activation?.type
        && ((checkId && item.flags?.ddbimporter?.id === owned.flags?.ddbimporter?.id) || !checkId);

      return simpleMatch;
    });

    if (existingItem) {
      if (existingItem.flags.ddbimporter?.ignoreItemImport) {
        returnItems.push(duplicate(existingItem));
      } else {
        item["_id"] = existingItem.id;
        if (getProperty(existingItem, "flags.ddbimporter.ignoreIcon") === true) {
          item.img = existingItem.img;
          setProperty(item, "flags.ddbimporter.ignoreIcon", true);
        }
        if (getProperty(existingItem, "flags.ddbimporter.retainResourceConsumption")) {
          item.system.consume = existingItem.system.consume;
          setProperty(item, "flags.ddbimporter.retainResourceConsumption", true);
          if (hasProperty(existingItem, "flags.link-item-resource-5e")) {
            setProperty(item, "flags.link-item-resource-5e", existingItem.flags["link-item-resource-5e"]);
          }
        }

        if (!item.effects
          || (item.effects && item.effects.length == 0 && existingItem.effects && existingItem.effects.length > 0)
        ) {
          item.effects = duplicate(existingItem.getEmbeddedCollection("ActiveEffect"));
        }

        returnItems.push(item);
      }
    } else {
      returnItems.push(item);
    }
  });

  logger.debug("Finished retaining items");
  return returnItems;
}


async function addNPCToCompendium(npc, type = "monster") {
  const compendium = CompendiumHelper.getCompendiumType(type, false);
  if (compendium) {
    const npcBasic = (await addCompendiumFolderIds([duplicate(npc)], type))[0];

    // unlock the compendium for update/create
    compendium.configure({ locked: false });

    let compendiumNPC;
    if (hasProperty(npc, "_id") && compendium.index.has(npc._id)) {
      if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing")) {
        const existingNPC = await compendium.getDocument(npc._id);

        if (hasProperty(existingNPC, "prototypeToken.flags.tagger.tags")) {
          const newTags = [...new Set(npcBasic.prototypeToken.flags.tagger.tags, existingNPC.prototypeToken.flags.tagger.tags)];
          setProperty(existingNPC, "prototypeToken.flags.tagger.tags", newTags);
        }

        const monsterTaggedItems = npcBasic.items.map((item) => {
          setProperty(item, "flags.ddbimporter.parentId", npc._id);
          return item;
        });
        const existingItems = existingNPC.getEmbeddedCollection("Item");
        npcBasic.items = await existingItemRetentionCheck(existingItems, monsterTaggedItems, false);

        logger.debug("NPC Update Data", duplicate(npcBasic));
        await existingNPC.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
        await existingNPC.deleteEmbeddedDocuments("ActiveEffect", [], { deleteAll: true });
        compendiumNPC = await existingNPC.update(npcBasic, { pack: compendium.collection, recursive: true, keepId: true });
        if (!compendiumNPC) {
          logger.debug("No changes made to base character", npcBasic);
          compendiumNPC = existingNPC;
        }
      }
    } else {
      // create the new npc
      logger.debug(`Creating NPC actor ${npcBasic.name}`);
      const options = {
        displaySheet: false,
        pack: compendium.collection,
        keepId: true,
      };
      logger.debug("NPC New Data", duplicate(npcBasic));
      compendiumNPC = await Actor.create(npcBasic, options);
    }

    // using compendium folders v10?
    if (compendiumNPC && isNewerVersion(11, game.version)) {
      await compendiumFoldersV10(compendiumNPC, "npc");
      return compendiumNPC;
    }
  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return npc;
}

export async function addNPCsToCompendium(npcsData, type = "monster") {
  const compendium = CompendiumHelper.getCompendiumType(type, false);
  let results = [];
  if (compendium) {
    const npcs = addCompendiumFolderIds(npcsData, type);
    // unlock the compendium for update/create
    compendium.configure({ locked: false });

    const options = {
      pack: compendium.collection,
      displaySheet: false,
      recursive: false,
      keepId: true,
    };

    if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing")) {
      const updateNPCs = npcs.filter((npc) => hasProperty(npc, "_id") && compendium.index.has(npc._id));
      logger.debug("NPCs Update Data", duplicate(updateNPCs));
      const updateResults = await Actor.updateDocuments(updateNPCs, options);
      results = results.concat(updateResults);
    }

    const newNPCs = npcs.filter((npc) => !hasProperty(npc, "_id") || !compendium.index.has(npc._id));
    logger.debug("NPC New Data", duplicate(newNPCs));
    const createResults = await Actor.createDocuments(newNPCs, options);
    results = results.concat(createResults);
  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return results;
}

export async function addNPCDDBId(npc, type = "monster") {
  let npcBasic = duplicate(npc);
  const compendium = CompendiumHelper.getCompendiumType(type, false);
  if (compendium) {
    // unlock the compendium for update/create
    compendium.configure({ locked: false });
    const monsterIndexFields = ["name", "flags.ddbimporter.id"];

    const index = await compendium.getIndex({ fields: monsterIndexFields });
    const npcMatch = index.contents.find((entity) =>
      !hasProperty(entity, "flags.ddbimporter.id")
      && entity.name.toLowerCase() === npcBasic.name.toLowerCase()
    );

    if (npcMatch) {
      if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing")) {
        const existingNPC = await compendium.getDocument(npcMatch._id);
        const updateDDBData = {
          _id: npcMatch._id,
          "flags.ddbimporter.id": npcBasic.flags.ddbimporter.id,
        };
        logger.debug("NPCId Update Data", duplicate(updateDDBData));
        await existingNPC.update(updateDDBData);
      }
    }
  } else {
    logger.error("Error opening compendium, check your settings");
  }
}


// eslint-disable-next-line complexity, no-unused-vars
export async function getNPCImage(npcData, { type = "monster", forceUpdate = false, forceUseFullToken = false,
  forceUseTokenAvatar = false, disableAutoTokenizeOverride = false } = {}
) {
  // check to see if we have munched flags to work on
  if (!hasProperty(npcData, "flags.monsterMunch.img")) {
    return npcData;
  }

  const updateImages = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images");
  if (!forceUpdate && !updateImages && npcData.img !== CONST.DEFAULT_TOKEN) {
    return npcData;
  }

  let ddbAvatarUrl = npcData.flags.monsterMunch.img;
  let ddbTokenUrl = npcData.flags.monsterMunch.tokenImg;
  const isStock = npcData.flags.monsterMunch.isStockImg;
  const useAvatarAsToken = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-full-token-image") || forceUseFullToken;
  const useTokenAsAvatar = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-token-avatar-image") || forceUseTokenAvatar;
  if (useAvatarAsToken) {
    ddbTokenUrl = ddbAvatarUrl;
  } else if (useTokenAsAvatar) {
    ddbAvatarUrl = ddbTokenUrl;
  }

  const npcType = type.startsWith("vehicle") ? "vehicle" : npcData.system.details.type.value;
  const genericNPCName = utils.referenceNameString(npcType);
  const npcName = utils.referenceNameString(npcData.name);

  if (!ddbAvatarUrl && ddbTokenUrl) ddbAvatarUrl = ddbTokenUrl;
  if (!ddbTokenUrl && ddbAvatarUrl) ddbTokenUrl = ddbAvatarUrl;

  const hasAvatarProcessedAlready = CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.get(ddbAvatarUrl);
  const hasTokenProcessedAlready = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);

  const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
  const subType = getProperty(npcData, "system.details.type.value") ?? "other";
  const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

  if (ddbAvatarUrl && getProperty(npcData, "flags.monsterMunch.imgSet") !== true) {
    if (hasAvatarProcessedAlready) {
      npcData.img = CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.get(ddbAvatarUrl);
    } else {
      const ext = ddbAvatarUrl.split(".").pop().split(/#|\?|&/)[0];
      const genericNpc = ddbAvatarUrl.endsWith(npcType + "." + ext) || isStock;
      const name = genericNpc ? genericNPCName : npcName;
      const nameType = genericNpc ? "npc-generic" : "npc";
      const imageNamePrefix = useDeepPaths ? "" : nameType;
      const pathPostfix = useDeepPaths ? `/monster/avatar/${subType}` : "";
      const downloadOptions = { type: nameType, name, targetDirectory, pathPostfix, imageNamePrefix, force: forceUpdate || updateImages };
      // eslint-disable-next-line require-atomic-updates
      npcData.img = await FileHelper.getImagePath(ddbAvatarUrl, downloadOptions);
    }
  }

  if (ddbTokenUrl && getProperty(npcData, "flags.monsterMunch.tokenImgSet") !== true) {
    if (hasTokenProcessedAlready) {
      npcData.prototypeToken.texture.src = CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.get(ddbTokenUrl);
    } else {
      const tokenExt = ddbTokenUrl.split(".").pop().split(/#|\?|&/)[0];
      const genericNpc = ddbTokenUrl.endsWith(npcType + "." + tokenExt) || isStock;
      const name = genericNpc ? genericNPCName : npcName;
      const nameType = genericNpc ? "npc-generic-token" : "npc-token";
      const imageNamePrefix = useDeepPaths ? "" : nameType;
      const pathPostfix = useDeepPaths ? `/monster/token/${subType}` : "";
      // Token images always have to be downloaded.
      const downloadOptions = {
        type: nameType,
        name, download: true,
        remoteImages: false,
        force: forceUpdate || updateImages,
        imageNamePrefix,
        pathPostfix,
        targetDirectory
      };
      // eslint-disable-next-line require-atomic-updates
      npcData.prototypeToken.texture.src = await FileHelper.getImagePath(ddbTokenUrl, downloadOptions);
    }
  }

  // check avatar, if not use token image
  // eslint-disable-next-line require-atomic-updates
  if (!npcData.img && npcData.prototypeToken.texture.src) npcData.img = npcData.prototypeToken.texture.src;

  // final check if image comes back as null
  // eslint-disable-next-line require-atomic-updates
  if (npcData.img === null) npcData.img = CONST.DEFAULT_TOKEN;
  // eslint-disable-next-line require-atomic-updates
  if (npcData.prototypeToken.texture.src === null) npcData.prototypeToken.texture.src = CONST.DEFAULT_TOKEN;

  // do we now want to tokenize that?
  const useTokenizer = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-tokenize")
    && !disableAutoTokenizeOverride
    && game.modules.get("vtta-tokenizer")?.active;
  // we don't tokenize if this path was already looked up, as it will already be done
  if (useTokenizer && !hasTokenProcessedAlready) {
    const compendiumLabel = CompendiumHelper.getCompendiumLabel(type);
    const tokenizerName = isStock
      ? npcType
      : npcData.name;
    const autoOptions = { name: tokenizerName, nameSuffix: `-${compendiumLabel}`, updateActor: false };
    // eslint-disable-next-line require-atomic-updates
    npcData.prototypeToken.texture.src = await window.Tokenizer.autoToken(npcData, autoOptions);
    logger.debug(`Generated tokenizer image at ${npcData.prototypeToken.texture.src}`);
  }

  if (!hasAvatarProcessedAlready) CONFIG.DDBI.KNOWN.AVATAR_LOOKUPS.set(ddbAvatarUrl, npcData.img);
  if (!hasTokenProcessedAlready) CONFIG.DDBI.KNOWN.TOKEN_LOOKUPS.set(ddbTokenUrl, npcData.prototypeToken.texture.src);

  return npcData;
}

async function swapItems(data) {
  const swap = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-items");

  if (swap) {
    logger.debug("Replacing items...");
    // console.info(data.items);
    const getItemOptions = {
      monsterMatch: true,
    };
    const updatedItems = await getCompendiumItems(data.items, "inventory", getItemOptions);
    const itemsToRemove = updatedItems.map((item) => {
      logger.debug(`${item.name} to ${item.flags.ddbimporter.originalItemName}`);
      return { name: item.flags.ddbimporter.originalItemName, type: item.type };
    });
    logger.debug("Swapping items", itemsToRemove);
    // console.warn(itemsToRemove);
    const lessUpdatedItems = data.items.filter((item) =>
      !itemsToRemove.some((target) => item.name === target.name && item.type === target.type)
    );
    // console.log(lessUpdatedItems);
    const newItems = lessUpdatedItems.concat(updatedItems);
    // console.error(newItems);
    // eslint-disable-next-line require-atomic-updates
    data.items = newItems;

  }
}

async function linkResourcesConsumption(actor) {
  if (actor.items.some((item) => item.system.recharge?.value)) {
    logger.debug(`Resource linking for ${actor.name}`);
    actor.items.forEach((item) => {
      if (item.system?.recharge?.value) {
        const itemID = randomID(16);
        item._id = itemID;
        if (item.type === "weapon") {
          item.type = "feat";
          delete item.system.weaponType;
          item.system.type = {
            value: "monster",
            subtype: "",
          };
        }
        item.system.consume = {
          type: "charges",
          target: itemID,
          amount: null,
        };
      }
    });
  }
  return actor;
}

// async function buildNPC(data, srdIconLibrary, iconMap) {
export async function buildNPC(data, type = "monster", temporary = true, update = false, handleBuild = false) {
  logger.debug("Importing Images");
  await getNPCImage(data, { type });
  logger.debug("Checking Items");
  await swapItems(data);

  // DAE
  const daeInstalled = game.modules.get("dae")?.active
    && (game.modules.get("Dynamic-Effects-SRD")?.active || game.modules.get("midi-srd")?.active);
  const daeCopy = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-dae-copy");
  if (daeInstalled && daeCopy) {
    DDBMuncher.munchNote(`Importing DAE Item for ${data.name}`);
    // eslint-disable-next-line require-atomic-updates
    data.items = await migrateItemsDAESRD(data.items);
  }

  logger.debug("Importing Icons");
  // eslint-disable-next-line require-atomic-updates
  data.items = await updateIcons(data.items, false, true, data.name);
  data = addActorEffectIcons(data);
  data = await linkResourcesConsumption(data);

  if (handleBuild) {
    // create the new npc
    logger.debug("Creating NPC actor");
    const options = {
      temporary: temporary,
      displaySheet: false,
    };
    if (update) {
      const npc = game.actors.get(data._id);
      await npc.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
      await Actor.updateDocuments([data]);
      return npc;
    } else {
      const npc = await Actor.create(data, options);
      return npc;
    }

  } else {
    return data;
  }

}

async function parseNPC (data, bulkImport, type) {
  const buildNpc = await buildNPC(data, type);
  logger.info(`Processing ${type} ${buildNpc.name} for the compendium`);
  if (bulkImport) {
    return buildNpc;
  } else {
    const compendiumNPC = await addNPCToCompendium(buildNpc, type);
    return compendiumNPC;
  }
}

export function addNPC(data, bulkImport, type) {
  return new Promise((resolve, reject) => {
    parseNPC(data, bulkImport, type)
      .then((npc) => {
        resolve(npc);
      })
      .catch((error) => {
        logger.error(`error parsing NPC type ${type}: ${error} ${data.name}`);
        logger.error(error.stack);
        reject(error);
      });
  });
}

export async function useSRDMonsterImages(monsters) {
  // eslint-disable-next-line require-atomic-updates
  if (game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-monster-images")) {
    const srdImageLibrary = await getSRDImageLibrary();
    DDBMuncher.munchNote(`Updating SRD Monster Images`, true);

    monsters.forEach((monster) => {
      logger.debug(`Checking ${monster.name} for srd images`);
      const nameMatch = srdImageLibrary.find((m) => m.name === monster.name && m.type === "npc");
      if (nameMatch) {
        logger.debug(`Updating monster ${monster.name} to srd images`, nameMatch);
        const compendiumName = SETTINGS.SRD_COMPENDIUMS.find((c) => c.type == "monsters").name;
        const moduleArt = game.dnd5e.moduleArt.map.get(`Compendium.${compendiumName}.${nameMatch._id}`);
        logger.debug(`Updating monster ${monster.name} to srd images`, { nameMatch, moduleArt });
        monster.prototypeToken.texture.scaleY = nameMatch.prototypeToken.texture.scaleY;
        monster.prototypeToken.texture.scaleX = nameMatch.prototypeToken.texture.scaleX;
        if (moduleArt?.actor && nameMatch.actor !== "" && !moduleArt.actor.includes("mystery-man")) {
          monster.img = moduleArt.actor;
          setProperty(monster, "flags.monsterMunch.imgSet", true);
        } else if (nameMatch.img && nameMatch.img !== "" && !nameMatch.img.includes("mystery-man")) {
          monster.img = nameMatch.img;
          setProperty(monster, "flags.monsterMunch.imgSet", true);
        }
        if (moduleArt?.token && !hasProperty(moduleArt, "token.texture.src")) {
          monster.prototypeToken.texture.src = moduleArt.token;
        } else if (moduleArt?.token?.texture?.src
          && moduleArt.token.texture.src !== ""
          && !moduleArt.token.texture.src.includes("mystery-man")
        ) {
          monster.prototypeToken.texture.src = moduleArt.token.texture.src;
          setProperty(monster, "flags.monsterMunch.tokenImgSet", true);
          if (moduleArt.token.texture.scaleY) monster.prototypeToken.texture.scaleY = moduleArt.token.texture.scaleY;
          if (moduleArt.token.texture.scaleX) monster.prototypeToken.texture.scaleX = moduleArt.token.texture.scaleX;
        } else if (nameMatch.prototypeToken?.texture?.src
          && nameMatch.prototypeToken.texture.src !== ""
          && !nameMatch.prototypeToken.texture.src.includes("mystery-man")
        ) {
          setProperty(monster, "flags.monsterMunch.tokenImgSet", true);
          monster.prototypeToken.texture.src = nameMatch.prototypeToken.texture.src;
        }
      }
    });
  }

  return monsters;
}

export async function generateIconMap(monsters) {
  let promises = [];

  const srdIcons = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-icons");
  // eslint-disable-next-line require-atomic-updates
  if (srdIcons) {
    const srdImageLibrary = await getSRDImageLibrary();
    DDBMuncher.munchNote(`Updating SRD Icons`, true);
    let itemMap = [];

    monsters.forEach((monster) => {
      DDBMuncher.munchNote(`Processing ${monster.name}`);
      promises.push(
        copySRDIcons(monster.items, srdImageLibrary, itemMap).then((items) => {
          monster.items = items;
        })
      );
    });
  }

  return Promise.all(promises);
}

export function copyExistingMonsterImages(monsters, existingMonsters) {
  const updated = monsters.map((monster) => {
    const existing = existingMonsters.find((m) => monster.name === m.name);
    if (existing) {
      monster.img = existing.img;
      for (const key of Object.keys(monster.prototypeToken)) {
        if (!["sight", "detectionModes"].includes(key)) {
          monster.prototypeToken[key] = deepClone(existing.prototypeToken[key]);
        }
      }
      return monster;
    } else {
      return monster;
    }
  });
  return updated;
}
