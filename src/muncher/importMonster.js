import utils from "../utils.js";
import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import { updateIcons, getImagePath, getCompendiumItems, getSRDIconLibrary, copySRDIcons, copySupportedItemFlags, compendiumFolders } from "./import.js";
import { getCompendiumType, munchNote } from "./utils.js";
import { migrateItemsDAESRD } from "./dae.js";

var compendiumLoaded = false;
var monsterCompendium;

/**
 *
 * @param {[string]} items Array of Strings or
 */
async function retrieveCompendiumItems(items, compendiumName) {
  const GET_ENTITY = true;

  const itemNames = items.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "name")) return item.name;
    return "";
  });

  const results = await utils.queryCompendiumEntries(compendiumName, itemNames, GET_ENTITY);
  const cleanResults = results.filter((item) => item !== null);

  return cleanResults;
}


/**
 *
 * @param {[items]} spells Array of Strings or items
 */
async function retrieveSpells(spells) {
  const compendiumName = await game.settings.get("ddb-importer", "entity-spell-compendium");
  const compendiumItems = await retrieveCompendiumItems(spells, compendiumName);
  const itemData = compendiumItems.map((i) => i.toJSON());

  return itemData;
}

// /**
//  *
//  * @param {[string]} items Array of Strings or items
//  */
// async function retrieveItems(items) {
//   const compendiumName = await game.settings.get("ddb-importer", "entity-item-compendium");

//   return retrieveCompendiumItems(items, compendiumName);
// }

function getMonsterCompendium() {
  if (compendiumLoaded) return monsterCompendium;
  monsterCompendium = getCompendiumType("monster", false);
  if (monsterCompendium) {
    // eslint-disable-next-line require-atomic-updates
    compendiumLoaded = true;
    return monsterCompendium;
  }
  return undefined;
}

export function checkMonsterCompendium() {
  compendiumLoaded = false;
  monsterCompendium = undefined;
  return getMonsterCompendium();
}

async function addNPCToCompendium(npc) {
  const compendium = getMonsterCompendium();
  if (compendium) {
    // unlock the compendium for update/create
    compendium.configure({ locked: false });

    const index = await compendium.getIndex();
    const npcMatch = index.contents.find((entity) => entity.name.toLowerCase() === npc.name.toLowerCase());

    let compendiumNPC;
    if (npcMatch) {
      if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
        const existingNPC = await compendium.getDocument(npcMatch._id);

        const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
        if (!updateImages && existingNPC.data.img !== "icons/svg/mystery-man.svg") {
          npc.img = existingNPC.data.img;
        }
        if (!updateImages && existingNPC.data.token.img !== "icons/svg/mystery-man.svg") {
          npc.token.img = existingNPC.data.token.img;
          npc.token.scale = existingNPC.data.token.scale;
          npc.token.randomImg = existingNPC.data.token.randomImg;
          npc.token.mirrorX = existingNPC.data.token.mirrorX;
          npc.token.mirrorY = existingNPC.data.token.mirrorY;
          npc.token.lockRotation = existingNPC.data.token.lockRotation;
          npc.token.rotation = existingNPC.data.token.rotation;
          npc.token.alpha = existingNPC.data.token.alpha;
          npc.token.lightAlpha = existingNPC.data.token.lightAlpha;
          npc.token.lightAnimation = existingNPC.data.token.lightAnimation;
          npc.token.tint = existingNPC.data.token.tint;
          npc.token.lightColor = existingNPC.data.token.lightColor;
        }
        npc._id = npcMatch._id;
        await copySupportedItemFlags(existingNPC.data, npc);

        await existingNPC.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
        compendiumNPC = await existingNPC.update(npc);
      }
    } else {
      // create the new npc
      logger.debug(`Creating NPC actor ${npc.name}`);
      const options = {
        temporary: true,
        displaySheet: false,
      };
      const newNPC = await Actor.create(npc, options);
      compendiumNPC = await compendium.importDocument(newNPC);
    }

    // using compendium folders?
    await compendiumFolders(compendiumNPC, "npc");
  } else {
    logger.error("Error opening compendium, check your settings");
  }
}


async function getNPCImage(data) {
  // check to see if we have munched flags to work on
  if (!data.flags || !data.flags.monsterMunch || !data.flags.monsterMunch.img) {
    return false;
  }

  const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
  if (!updateImages && data.img !== "icons/svg/mystery-man.svg") {
    return false;
  }

  let dndBeyondImageUrl = data.flags.monsterMunch.img;
  let dndBeyondTokenImageUrl = data.flags.monsterMunch.tokenImg;
  const useAvatarAsToken = game.settings.get("ddb-importer", "munching-policy-use-full-token-image");
  const useTokenAsAvatar = game.settings.get("ddb-importer", "munching-policy-use-token-avatar-image");
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

  return true;
}

function getSpellEdgeCase(spell, type, spellList) {
  const edgeCases = spellList.edgeCases;
  const edgeCase = edgeCases.find((edge) => edge.name.toLowerCase() === spell.name.toLowerCase() && edge.type === type);

  if (edgeCase) {
    logger.debug(`Spell edge case for ${spell.name}`);
    switch (edgeCase.edge.toLowerCase()) {
      case "self":
      case "self only":
        spell.data.target.type = "self";
        logger.debug("spell target changed to self");
        break;
      // no default
    }
    spell.name = `${spell.name} (${edgeCase.edge})`;
    spell.data.description.chat = `<p><b>Special Notes: ${edgeCase.edge}.</b></p>\n\n${spell.data.description.chat}`;
    spell.data.description.value = `<p><b>Special Notes: ${edgeCase.edge}.</b></p>\n\n${spell.data.description.value}`;

    const diceSearch = /(\d+)d(\d+)/;
    const diceMatch = edgeCase.edge.match(diceSearch);
    if (diceMatch) {
      if (spell.data.damage.parts[0] && spell.data.damage.parts[0][0]) {
        spell.data.damage.parts[0][0] = diceMatch[0];
      } else if (spell.data.damage.parts[0]) {
        spell.data.damage.parts[0] = [diceMatch[0]];
      } else {
        spell.data.damage.parts = [[diceMatch[0]]];
      }
    }

    // save DC 12
    const saveSearch = /save DC (\d+)/;
    const saveMatch = edgeCase.edge.match(saveSearch);
    if (saveMatch) {
      spell.data.save.dc = saveMatch[1];
      spell.data.save.scaling = "flat";
    }

  }

  // remove material components?
  if (!spellList.material) {
    spell.data.materials = {
      value: "",
      consumed: false,
      cost: 0,
      supply: 0
    };
    spell.data.components.material = false;
  }

}

async function addSpells(data) {
  // check to see if we have munched flags to work on
  if (!data.flags || !data.flags.monsterMunch || !data.flags.monsterMunch.spellList) {
    return;
  }

  const spellList = data.flags.monsterMunch.spellList;
  logger.debug(`Spell List for edgecases`, spellList);
  const atWill = spellList.atwill;
  const klass = spellList.class;
  const innate = spellList.innate;
  const pact = spellList.pact;

  if (atWill.length !== 0) {
    logger.debug("Retrieving at Will spells:", atWill);
    let spells = await retrieveSpells(atWill);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      if (spell.data.level == 0) {
        spell.data.preparation = {
          mode: "prepared",
          prepared: false,
        };
      } else {
        spell.data.preparation = {
          mode: "atwill",
          prepared: false,
        };
        spell.data.uses = {
          value: null,
          max: null,
          per: "",
        };
      }
      getSpellEdgeCase(spell, "atwill", spellList);
      return spell;
    });
    // eslint-disable-next-line require-atomic-updates
    data.items = data.items.concat(spells);
  }

  // class spells
  if (klass.length !== 0) {
    logger.debug("Retrieving class spells:", klass);
    let spells = await retrieveSpells(klass);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      spell.data.preparation = {
        mode: "prepared",
        prepared: true,
      };
      getSpellEdgeCase(spell, "class", spellList);
      return spell;
    });
    // eslint-disable-next-line require-atomic-updates
    data.items = data.items.concat(spells);
  }

  // pact spells
  if (pact.length !== 0) {
    logger.debug("Retrieving pact spells:", pact);
    let spells = await retrieveSpells(pact);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      spell.data.preparation = {
        mode: "pact",
        prepared: true,
      };
      getSpellEdgeCase(spell, "pact", spellList);
      return spell;
    });
    // eslint-disable-next-line require-atomic-updates
    data.items = data.items.concat(spells);
  }

  // innate spells
  if (innate.length !== 0) {
    // innate:
    // {name: "", type: "srt/lng/day", value: 0}
    logger.debug("Retrieving innate spells:", innate);
    const spells = await retrieveSpells(innate);
    const innateSpells = spells.filter((spell) => spell !== null)
      .map((spell) => {
        const spellInfo = innate.find((w) => w.name.toLowerCase() == spell.name.toLowerCase());
        if (spellInfo) {
          spell.data.preparation = {
            mode: "innate",
            prepared: true,
          };
          const per = DICTIONARY.resets.find((d) => d.id == spellInfo.type);
          spell.data.uses = {
            value: spellInfo.value,
            max: spellInfo.value,
            per: (per && per.type) ? per.type : "day",
          };
          getSpellEdgeCase(spell, "innate", spellList);
        }
        return spell;
      });
    // eslint-disable-next-line require-atomic-updates
    data.items = data.items.concat(innateSpells);
  }
}

async function swapItems(data) {
  const swap = game.settings.get("ddb-importer", "munching-policy-monster-items");

  if (swap) {
    logger.debug("Replacing items...");
    // console.info(data.items);
    const updatedItems = await getCompendiumItems(data.items, "inventory", null, false, true);
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
  logger.debug("Importing Spells");
  await addSpells(data);
  logger.debug("Checking Items");
  await swapItems(data);

  // DAE
  const daeInstalled = utils.isModuleInstalledAndActive("dae") &&
    (utils.isModuleInstalledAndActive("Dynamic-Effects-SRD") || utils.isModuleInstalledAndActive("midi-srd"));
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

async function parseNPC (data) {
  let npc = await buildNPC(data);
  logger.debug(`Adding actor ${npc.name} to compendium`);
  await addNPCToCompendium(npc);
  return npc;
}

export function addNPC(data) {
  return new Promise((resolve, reject) => {
    parseNPC(data)
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
