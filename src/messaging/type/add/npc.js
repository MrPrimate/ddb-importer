import utils from "../../../utils.js";
import logger from "../../../logger.js";

const SAVE_ALL = 0;
const SAVE_NONE = 2;

const CLEAN_MONSTERS = 1;
const CLEAN_ALL = 3;

/**
 * Sends a event request to Iconizer to add the correct icons
 * @param {*} names
 */
let queryIcons = (names) => {
  return new Promise((resolve, reject) => {
    let listener = (event) => {
      resolve(event.detail);
      // cleaning up
      document.removeEventListener("deliverIcon", listener);
    };

    setTimeout(() => {
      document.removeEventListener("deliverIcon", listener);
      reject("Tokenizer not responding");
    }, 500);
    document.addEventListener("deliverIcon", listener);
    document.dispatchEvent(new CustomEvent("queryIcons", { detail: { names: names } }));
  });
};

/**
 *
 * @param {[string]} spells Array of Strings or
 */
const retrieveSpells = async (spells) => {
  let compendiumName = await game.settings.get("ddb-importer", "entity-spell-compendium");
  const GET_ENTITY = true;

  const spellNames = spells.map((spell) => {
    if (typeof spell === "string") return spell;
    if (typeof spell === "object" && Object.prototype.hasOwnProperty.call(spell, "name")) return spell.name;
    return "";
  });

  return utils.queryCompendiumEntries(compendiumName, spellNames, GET_ENTITY);
};

const getCompendium = async () => {
  const compendiumName = await game.settings.get("ddb-importer", "entity-monster-compendium");
  if (compendiumName && compendiumName !== "") {
    const compendium = await game.packs.find((pack) => pack.collection === compendiumName);
    if (compendium) {
      return compendium;
    }
  }
  return undefined;
};

const addNPCToCompendium = async (npc, name) => {
  // decide wether to save it into the compendium
  if (game.settings.get("ddb-importer", "entity-import-policy") !== SAVE_NONE) {
    // update existing (1) or overwrite (0)
    const compendium = await getCompendium();
    if (compendium) {
      // unlock the compendium for update/create
      compendium.locked = false;

      let index = await compendium.getIndex();
      let entity = index.find((entity) => entity.name.toLowerCase() === name.toLowerCase());
      if (entity) {
        if (SAVE_ALL) {
          const compendiumNPC = JSON.parse(JSON.stringify(npc));
          compendiumNPC.data._id = entity._id;

          await compendium.updateEntity(compendiumNPC.data);
        }
      } else {
        await compendium.createEntity(npc.data);
      }
    } else {
      logger.error("Error opening compendium, check your settings");
    }
  }
};

// we are creating the NPC here not temporary
let createNPC = async (npc, options) => {
  let icons = npc.items.map((item) => {
    return {
      name: item.name,
    };
  });
  try {
    utils.log("Querying iconizer for icons");
    icons = await queryIcons(icons);
    utils.log(icons);

    // replace the icons
    for (let item of npc.items) {
      let icon = icons.find((icon) => icon.name === item.name);
      if (icon) {
        item.img = icon.img;
      }
    }
  } catch (exception) {
    utils.log("Iconizer not responding");
  }

  // let result = await Actor5e.create(npc, options);
  // should be aliased again
  let result = await Actor.create(npc, options);

  // if (npc.flags.ddbimporter.dndbeyond.spells.length !== 0) {
  //   // update existing (1) or overwrite (0)
  //   let spells = await retrieveSpells(npc.flags.ddbimporter.dndbeyond.spells);
  //   spells = spells.map((spell) => spell.data);
  //   await result.createEmbeddedEntity("OwnedItem", spells);
  // }

  return result;
};

const getTokenSenses = async (senses) => {
   let token = {
    vision: true,
    dimSight: 0,
    brightSight: 0,
  };

  const senseTypes = {
    blindsight: "dimSight",
    darkvision: "dimSight",
    tremorsense: "brightSight",
    truesight: "brightSight",
  };

  senses.split(",").forEach((sense) => {
    let [name, range] = sense.trim().split(" ", 2);

    if (name !== undefined && range !== undefined) {
      name = name.toLowerCase();
      range = range.match(/\d+/)[0];
      if (senseTypes[name] !== undefined && range !== undefined) {
        const senseType = senseTypes[name];
        token[senseType] = token[senseType] < range ? range : token[senseType];
      }
    }
  });
  return token;
};

let buildNPC = async (data) => {
  // get the folder to add this npc into
  const folder = await utils.getFolder("npc", data.data.details.type, data.data.details.race);
  // in this instance I can't figure out how to make these safe, but the risk seems minimal.
  // eslint-disable-next-line require-atomic-updates
  data.folder = folder._id;

  // update the token vision
  const token = await getTokenSenses(data.data.traits.senses);
  // eslint-disable-next-line require-atomic-updates
  data.token = token;

  // replace icons by iconizer, if available
  let icons = data.items.map((item) => {
    return {
      name: item.name,
    };
  });
  try {
    logger.debug("Querying iconizer for icons");
    icons = await queryIcons(icons);
    logger.debug("Icons found", icons);

    // replace the icons
    for (let item of data.items) {
      let icon = icons.find((icon) => icon.name === item.name);
      if (icon) {
        item.img = icon.img;
      }
    }
  } catch (exception) {
    logger.warn("Iconizer not responding");
  }

  logger.debug("Importing NPC");
  // check if there is an NPC with that name in that folder already
  let npc = folder.content ? folder.content.find((actor) => actor.name === data.name) : undefined;
  if (npc) {
    logger.debug("NPC exists");
    // remove the inventory of said npc
    await npc.deleteEmbeddedEntity(
      "OwnedItem",
      npc.getEmbeddedCollection("OwnedItem").map((item) => item._id)
    );

    // update items and basic data
    await npc.update(data);
    logger.debug("NPC updated");
    if (data.flags.ddbimporter.dndbeyond.spells && data.flags.ddbimporter.dndbeyond.spells.length !== 0) {
      logger.debug("Retrieving spells:", data.flags.ddbimporter.dndbeyond.spells);
      let spells = await retrieveSpells(data.flags.ddbimporter.dndbeyond.spells);
      spells = spells.filter((spell) => spell !== null);
      await npc.createEmbeddedEntity("OwnedItem", spells);
    }
  } else {
    let dndBeyondImageUrl = data.flags.ddbimporter.dndbeyond.img;
    if (dndBeyondImageUrl) {
      let uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");
      // in this instance I can't figure out how to make this safe, but the risk seems minimal.

      let npcType = data.data.details.type;
      let ext = dndBeyondImageUrl
        .split(".")
        .pop()
        .split(/#|\?|&/)[0];

      if (dndBeyondImageUrl.endsWith(npcType + "." + ext)) {
        let filename =
          "npc-generic-" +
          npcType
            .replace(/[^a-zA-Z]/g, "-")
            .replace(/-+/g, "-")
            .trim();

        if (!(await utils.fileExists(uploadDirectory, filename + "." + ext))) {
          // eslint-disable-next-line require-atomic-updates
          data.img = await utils.uploadImage(dndBeyondImageUrl, uploadDirectory, filename);
        } else {
          // eslint-disable-next-line require-atomic-updates
          data.img = utils.getFileUrl(uploadDirectory, filename + "." + ext);
        }
      } else {
        // image upload
        let filename =
          "npc-" +
          data.name
            .replace(/[^a-zA-Z]/g, "-")
            .replace(/-+/g, "-")
            .trim();

        // eslint-disable-next-line require-atomic-updates
        data.img = await utils.uploadImage(dndBeyondImageUrl, uploadDirectory, filename);
      }
    }

    // create the new npc
    npc = await createNPC(data, {
      temporary: false,
      displaySheet: true,
    });
  }
  return npc;
};

const getSpellCompendium = async () => {
  const compendiumName = await game.settings.get("ddb-importer", "entity-spell-compendium");
  if (compendiumName && compendiumName !== "") {
    const compendium = await game.packs.find((pack) => pack.collection === compendiumName);
    if (compendium) {
      return compendium;
    }
  }
  return undefined;
};

const processSpells = async (spells) => {
  // decide wether to save it into the compendium
  if (game.settings.get("ddb-importer", "entity-import-policy") !== SAVE_NONE) {
    // update existing (1) or overwrite (0)
    const compendium = await getSpellCompendium();
    if (!compendium) {
      logger.error("Error opening compendium, check your settings");
      return;
    }

    // unlock the compendium for update/create
    compendium.locked = false;

    let index = await compendium.getIndex();
    for (let spell of spells) {
      const spellName = spell.name.toLowerCase();
      let entity = index.find((entity) => entity.name.toLowerCase() === spellName);
      if (entity) {
        if (SAVE_ALL) {
          const compendiumSpell = JSON.parse(JSON.stringify(spell));
          compendiumSpell.data._id = entity._id;
          compendium.updateEntity(compendiumSpell.data);
        }
      } else {
        compendium.createEntity(spell);
      }
    }
  }
};

const cleanUp = async (npc) => {
  // cleaning up after imports
  const cleanupAfterImport =
    game.settings.get("ddb-importer", "entity-cleanup-policy") === CLEAN_ALL ||
    game.settings.get("ddb-importer", "entity-cleanup-policy") === CLEAN_MONSTERS;
  if (cleanupAfterImport) {
    await npc.delete();
  }
};

const parseNPC = async (body) => {
  let npc = await buildNPC(body.data);
  // adding spells to the compendium, if necessary
  processSpells(npc.items.filter((i) => i.type === "spell").map((spell) => spell.data));
  // add the NPC to the compendium, if necessary
  await addNPCToCompendium(npc, body.data.name);
  await cleanUp(npc);
  return npc;
};

let addNPC = (body) => {
  return new Promise((resolve, reject) => {
    logger.debug("npc.js addNPC body parameter", body);
    parseNPC(body)
      .then((npc) => {
        logger.debug("npc.js addNPC parseNPC result", npc);
        resolve(npc.data);
      })
      .catch((error) => {
        logger.error(`error parsing NPC: ${error}`);
        reject(error);
      });
  });
};

export default addNPC;
