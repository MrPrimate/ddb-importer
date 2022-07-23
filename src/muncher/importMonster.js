import utils from "../utils.js";
import logger from "../logger.js";
import { updateIcons, getImagePath, getCompendiumItems, getSRDIconLibrary, copySRDIcons, compendiumFolders } from "./import.js";
import { getCompendiumType, munchNote, getCompendiumLabel } from "./utils.js";
import { migrateItemsDAESRD } from "./dae.js";

// check items to see if retaining item, img or resources
async function existingItemRetentionCheck(currentItems, newItems, checkId = true) {
  const returnItems = [];

  await newItems.forEach((item) => {
    const existingItem = currentItems.find((owned) => {
      const simpleMatch =
        item.name === owned.data.name &&
        item.type === owned.data.type &&
        ((checkId && item.flags?.ddbimporter?.id === owned.data.flags?.ddbimporter?.id) || !checkId);

      return simpleMatch;
    });

    if (existingItem) {
      if (existingItem.data.flags.ddbimporter?.ignoreItemImport) {
        returnItems.push(duplicate(existingItem));
      } else {
        item["_id"] = existingItem.id;
        if (getProperty(existingItem, "data.flags.ddbimporter.ignoreIcon") === true) {
          item.img = existingItem.data.img;
          setProperty(item, "flags.ddbimporter.ignoreIcon", true);
        }
        if (getProperty(existingItem, "data.flags.ddbimporter.retainResourceConsumption")) {
          item.data.consume = existingItem.data.data.consume;
          setProperty(item, "flags.ddbimporter.retainResourceConsumption", true);
          if (hasProperty(existingItem, "data.flags.link-item-resource-5e")) {
            setProperty(item, "flags.link-item-resource-5e", existingItem.data.flags["link-item-resource-5e"]);
          }
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


async function addNPCToCompendium(npc) {
  const compendium = getCompendiumType("monster", false);
  if (compendium) {
    const npcBasic = duplicate(npc);

    // unlock the compendium for update/create
    compendium.configure({ locked: false });

    let compendiumNPC;
    if (hasProperty(npc, "_id") && compendium.index.has(npc._id)) {
      if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
        const existingNPC = await compendium.getDocument(npc._id);

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

    // using compendium folders?
    if (compendiumNPC) {
      await compendiumFolders(compendiumNPC, "npc");
      return compendiumNPC;
    }
  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return npc;
}

export async function addNPCsToCompendium(npcs) {
  const compendium = getCompendiumType("monster", false);
  let results = [];
  if (compendium) {
    // unlock the compendium for update/create
    compendium.configure({ locked: false });

    const options = {
      pack: compendium.collection,
      displaySheet: false,
      recursive: false,
      keepId: true,
    };

    if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
      const updateNPCs = npcs.filter((npc) => hasProperty(npc, "_id") && compendium.index.has(npc._id));
      logger.debug("NPC Update Data", duplicate(updateNPCs));
      const updateResults = await Actor.updateDocuments(updateNPCs, options);
      results = results.concat(updateResults);
    }

    const newNPCs = npcs.filter((npc) => !hasProperty(npc, "_id") || !compendium.index.has(npc._id));
    logger.debug("NPC New Data", duplicate(newNPCs));
    const createResults = await Actor.createDocuments(newNPCs, options);
    results = results.concat(createResults);

    // // using compendium folders?
    // if (compendiumNPC) {
    //   await compendiumFolders(compendiumNPC, "npc");
    //   return compendiumNPC;
    // }
  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return results;
}

export async function addNPCDDBId(npc) {
  let npcBasic = duplicate(npc);
  const compendium = getCompendiumType("monster", false);
  if (compendium) {
    // unlock the compendium for update/create
    compendium.configure({ locked: false });
    const monsterIndexFields = ["name", "flags.ddbimporter.id"];

    const index = await compendium.getIndex({ fields: monsterIndexFields });
    const npcMatch = index.contents.find((entity) =>
      !hasProperty(entity, "flags.ddbimporter.id") &&
      entity.name.toLowerCase() === npcBasic.name.toLowerCase()
    );

    if (npcMatch) {
      if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
        const existingNPC = await compendium.getDocument(npcMatch._id);
        const updateDDBData = {
          _id: npcMatch._id,
          "flags.ddbimporter.id": npcBasic.flags.ddbimporter.id,
        };
        logger.debug("NPC Update Data", duplicate(updateDDBData));
        await existingNPC.update(updateDDBData);
      }
    }
  } else {
    logger.error("Error opening compendium, check your settings");
  }
}


// eslint-disable-next-line complexity
export async function getNPCImage(data, options) {
  const defaultOptions = { forceUpdate: false, forceUseFullToken: false, forceUseTokenAvatar: false, disableAutoTokenizeOverride: false };
  const mergedOptions = mergeObject(defaultOptions, options);
  // check to see if we have munched flags to work on
  if (!data.flags || !data.flags.monsterMunch || !data.flags.monsterMunch.img) {
    return data;
  }

  const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images") || mergedOptions.forceUpdate;
  if (!updateImages && data.img !== "icons/svg/mystery-man.svg") {
    return data;
  }

  let dndBeyondImageUrl = data.flags.monsterMunch.img;
  let dndBeyondTokenImageUrl = data.flags.monsterMunch.tokenImg;
  const useAvatarAsToken = game.settings.get("ddb-importer", "munching-policy-use-full-token-image") || mergedOptions.forceUseFullToken;
  const useTokenAsAvatar = game.settings.get("ddb-importer", "munching-policy-use-token-avatar-image") || mergedOptions.forceUseTokenAvatar;
  if (useAvatarAsToken) {
    dndBeyondTokenImageUrl = dndBeyondImageUrl;
  } else if (useTokenAsAvatar) {
    dndBeyondImageUrl = dndBeyondTokenImageUrl;
  }

  const npcType = data.data.details.type.value;
  const genericNPCName = npcType.replace(/[^a-zA-Z]/g, "-").replace(/-+/g, "-").trim();
  const npcName = data.name.replace(/[^a-zA-Z]/g, "-").replace(/-+/g, "-").trim();

  if (!dndBeyondImageUrl && dndBeyondTokenImageUrl) dndBeyondImageUrl = dndBeyondTokenImageUrl;
  if (!dndBeyondTokenImageUrl && dndBeyondImageUrl) dndBeyondTokenImageUrl = dndBeyondImageUrl;

  if (dndBeyondImageUrl) {
    const ext = dndBeyondImageUrl.split(".").pop().split(/#|\?|&/)[0];

    if (dndBeyondImageUrl.endsWith(npcType + "." + ext)) {
      // eslint-disable-next-line require-atomic-updates
      data.img = await getImagePath(dndBeyondImageUrl, "npc-generic", genericNPCName);
    } else {
      // eslint-disable-next-line require-atomic-updates
      data.img = await getImagePath(dndBeyondImageUrl, "npc", npcName);
    }
  }

  // Currently token images always have to be downloaded. Not sure why.
  if (dndBeyondTokenImageUrl) {
    const tokenExt = dndBeyondTokenImageUrl.split(".").pop().split(/#|\?|&/)[0];

    if (dndBeyondTokenImageUrl.endsWith(npcType + "." + tokenExt)) {
      // eslint-disable-next-line require-atomic-updates
      data.token.img = await getImagePath(dndBeyondTokenImageUrl, "npc-generic-token", genericNPCName, true, false);
    } else {
      // eslint-disable-next-line require-atomic-updates
      data.token.img = await getImagePath(dndBeyondTokenImageUrl, "npc-token", npcName, true, false);
    }
  }

  // check avatar, if not use token image
  // eslint-disable-next-line require-atomic-updates
  if (!data.img && data.token.img) data.img = data.token.img;

  // final check if image comes back as null
  // eslint-disable-next-line require-atomic-updates
  if (data.img === null) data.img = "icons/svg/mystery-man.svg";
  // eslint-disable-next-line require-atomic-updates
  if (data.token.img === null) data.token.img = "icons/svg/mystery-man.svg";

  // okays, but do we now want to tokenize that?
  const tokenizerReady = game.settings.get("ddb-importer", "munching-policy-monster-tokenize") &&
    !mergedOptions.disableAutoTokenizeOverride &&
    game.modules.get("vtta-tokenizer")?.active &&
    utils.versionCompare(game.modules.get("vtta-tokenizer").data.version, "3.7.1") >= 0;
  if (tokenizerReady) {
    const compendiumLabel = getCompendiumLabel("monsters");
    // eslint-disable-next-line require-atomic-updates
    data.token.img = await window.Tokenizer.autoToken(data, { nameSuffix: `-${compendiumLabel}`, updateActor: false });
  }

  return data;
}

async function swapItems(data) {
  const swap = game.settings.get("ddb-importer", "munching-policy-monster-items");

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
  if (actor.items.some((item) => item.data?.recharge?.value)) {
    logger.debug(`Resource linking for ${actor.name}`);
    actor.items.forEach((item) => {
      if (item.data?.recharge?.value) {
        const itemID = randomID(16);
        item._id = itemID;
        if (item.type === "weapon") item.type = "feat";
        item.data.consume = {
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
export async function buildNPC(data, temporary = true, update = false, handleBuild = false) {
  logger.debug("Importing Images");
  await getNPCImage(data);
  logger.debug("Checking Items");
  await swapItems(data);

  // DAE
  const daeInstalled = game.modules.get("dae")?.active &&
    (game.modules.get("Dynamic-Effects-SRD")?.active || game.modules.get("midi-srd")?.active);
  const daeCopy = game.settings.get("ddb-importer", "munching-policy-dae-copy");
  if (daeInstalled && daeCopy) {
    munchNote(`Importing DAE Item for ${data.name}`);
    // eslint-disable-next-line require-atomic-updates
    data.items = await migrateItemsDAESRD(data.items);
  }

  logger.debug("Importing Icons");
  // eslint-disable-next-line require-atomic-updates
  data.items = await updateIcons(data.items, false, true, data.name);
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

async function parseNPC (data, bulkImport) {
  const buildNpc = await buildNPC(data);
  logger.info(`Processing actor ${buildNpc.name} for the compendium`);
  if (bulkImport) {
    return buildNpc;
  } else {
    const compendiumNPC = await addNPCToCompendium(buildNpc);
    return compendiumNPC;
  }
}

export function addNPC(data, bulkImport) {
  return new Promise((resolve, reject) => {
    parseNPC(data, bulkImport)
      .then((npc) => {
        resolve(npc);
      })
      .catch((error) => {
        logger.error(`error parsing NPC: ${error} ${data.name}`);
        logger.error(error.stack);
        reject(error);
      });
  });
}

export async function generateIconMap(monsters) {
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

export function copyExistingMonsterImages(monsters, existingMonsters) {
  const updated = monsters.map((monster) => {
    const existing = existingMonsters.find((m) => monster.name === m.name);
    if (existing) {
      monster.img = existing.img;
      monster.token.img = existing.token.img;
      return monster;
    } else {
      return monster;
    }
  });
  return updated;
}
