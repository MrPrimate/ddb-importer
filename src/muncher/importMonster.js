import utils from "../utils.js";
import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";

/**
 * Sends a event request to Iconizer to add the correct icons
 * @param {*} names
 */
function queryIcons(names) {
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
async function retrieveSpells(spells) {
  let compendiumName = await game.settings.get("ddb-importer", "entity-spell-compendium");
  const GET_ENTITY = true;

  const spellNames = spells.map((spell) => {
    if (typeof spell === "string") return spell;
    if (typeof spell === "object" && Object.prototype.hasOwnProperty.call(spell, "name")) return spell.name;
    return "";
  });

  return utils.queryCompendiumEntries(compendiumName, spellNames, GET_ENTITY);
};

async function getCompendium() {
  const compendiumName = await game.settings.get("ddb-importer", "entity-monster-compendium");
  if (compendiumName && compendiumName !== "") {
    const compendium = await game.packs.find((pack) => pack.collection === compendiumName);
    if (compendium) {
      return compendium;
    }
  }
  return undefined;
};

async function addNPCToCompendium(npc) {
  const compendium = await getCompendium();
  if (compendium) {
    // unlock the compendium for update/create
    compendium.locked = false;

    const index = await compendium.getIndex();
    const entity = index.find((entity) => entity.name.toLowerCase() === npc.name.toLowerCase());
    if (entity) {
      if (game.settings.get("ddb-importer", "munching-policy-update-existing")) {
        const compendiumNPC = JSON.parse(JSON.stringify(npc));
        compendiumNPC._id = entity._id;

        await compendium.updateEntity(compendiumNPC);
      }
    } else {
      await compendium.createEntity(npc);
    }
  } else {
    logger.error("Error opening compendium, check your settings");
  }
};

// we are creating the NPC here not temporary
async function createNPC(npc, options) {
  // let result = await Actor5e.create(npc, options);
  // should be aliased again
  let result = await Actor.create(npc, options);

  return result;
};

async function updateIcons(data) {
  // replace icons by iconizer, if available
  console.warn(data);
  const itemNames = data.items.map((item) => {
    return {
      name: item.name,
    };
  });
  try {
    logger.debug("Querying iconizer for icons");
    const icons = await queryIcons(itemNames);
    logger.verbose("Icons found", icons);

    // replace the icons
    for (let item of data.items) {
      const icon = icons.find((icon) => icon.name === item.name);
      if (icon && (item.img == "" || item.img == "icons/svg/mystery-man.svg")) {
        item.img = icon.img;
      }
    }
  } catch (exception) {
    logger.warn("Iconizer not responding");
  }
}


async function getNPCImage(data) {
  const dndBeyondImageUrl = data.flags.monsterMunch.img;
  const dndBeyondTokenImageUrl = data.flags.monsterMunch.tokenImg;
  if (dndBeyondImageUrl) {
    const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");
    const npcType = data.data.details.type;
    const ext = dndBeyondImageUrl
      .split(".")
      .pop()
      .split(/#|\?|&/)[0];

    if (dndBeyondImageUrl.endsWith(npcType + "." + ext)) {
      const filename =
        "npc-generic-" +
        npcType
          .replace(/[^a-zA-Z]/g, "-")
          .replace(/-+/g, "-")
          .trim();
      const filenameToken =
        "npc-generic-token-" +
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
      if (!(await utils.fileExists(uploadDirectory, filenameToken + "." + ext))) {
        // eslint-disable-next-line require-atomic-updates
        data.token.img = await utils.uploadImage(dndBeyondTokenImageUrl, uploadDirectory, filenameToken);
      } else {
        // eslint-disable-next-line require-atomic-updates
        data.token.img = utils.getFileUrl(uploadDirectory, filename + "." + ext);
      }
    } else {
      // image upload
      const filename =
        "npc-" +
        data.name
          .replace(/[^a-zA-Z]/g, "-")
          .replace(/-+/g, "-")
          .trim();
      const filenameToken =
        "npc-token-" +
        data.name
          .replace(/[^a-zA-Z]/g, "-")
          .replace(/-+/g, "-")
          .trim();
      // eslint-disable-next-line require-atomic-updates
      data.img = await utils.uploadImage(dndBeyondImageUrl, uploadDirectory, filename);
      // eslint-disable-next-line require-atomic-updates
      data.token.img = await utils.uploadImage(dndBeyondTokenImageUrl, uploadDirectory, filenameToken);
    }
  }

}

async function updateNPC(data) {
  logger.verbose("NPC exists");
  // remove the inventory of said npc
  await npc.deleteEmbeddedEntity(
    "OwnedItem",
    npc.getEmbeddedCollection("OwnedItem").map((item) => item._id)
  );

  // update items and basic data
  await npc.update(data);
  logger.verbose("NPC updated");
  if (data.flags.monsterMunch.spellList.length !== 0) {
    logger.debug("Retrieving spells:", data.flags.monsterMunch.spellList);
    let spells = await retrieveSpells(data.flags.monsterMunch.spellList);
    spells = spells.filter((spell) => spell !== null);
    await npc.createEmbeddedEntity("OwnedItem", spells);
  }
}

// async function buildNPC(data) {
//   // get the folder to add this npc into
//   const folder = await utils.getFolder("npc", data.data.details.type, data.data.details.race);
//   // in this instance I can't figure out how to make these safe, but the risk seems minimal.
//   // eslint-disable-next-line require-atomic-updates
//   data.folder = folder._id;

//   await updateIcons(data);

//   logger.debug("Importing NPC");
//   // check if there is an NPC with that name in that folder already
//   let npc = folder.content ? folder.content.find((actor) => actor.name === data.name) : undefined;
//   if (npc) {
//     await updateNPC(data);
//   } else {
//     await getNPCImage(data);
//     // create the new npc
//     npc = await createNPC(data, {
//       temporary: false,
//       displaySheet: true,
//     });
//   }
//   return npc;
// };

async function addSpells(data){

  // at will spells
  const atWill = data.flags.monsterMunch.spellList.atWill;
  const klass = data.flags.monsterMunch.spellList.class;
  const innate = data.flags.monsterMunch.spellList.innate;

  if (atWill.length !== 0) {
    logger.debug("Retrieving at Will spells:", klass);
    let spells = await retrieveSpells(klass);
    spells = spells.filter((spell) => spell !== null).map((spell) => {
      spell.data.preparation = {
        mode: "atwill",
        prepared: false,
      };
      spell.data.uses = {
        value: null,
        max: null,
        per: "",
      };
      return spell;
    });
    await npc.createEmbeddedEntity("OwnedItem", spells);
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
      return spell;
    });
    await npc.createEmbeddedEntity("OwnedItem", spells);
  }

  // innate spells
  if (innate.length !== 0) {
    const innateNames = innate.map((spell) => spell.name);
    // innate:
    // {name: "", type: "srt/lng/day", value: 0}
    logger.debug("Retrieving innate spells:", innateNames);
    const spells = await retrieveSpells(innateNames);
    const innateSpells = spells.filter((spell) => spell !== null)
      .map((spell) => {
        const spellInfo = innate.find((w) => w.name == spell.name);
        spell.data.preparation = {
          mode: "innate",
          prepared: true,
        };
        const per = DICTIONARY.resets.find((d) => d.id.toLowerCase() == spellInfo.type.toLowerCase() );
        spell.data.uses = {
          value: spellInfo.value,
          max: spellInfo.value,
          per: per.value ? per.value : "day",
        };
        return spell;
      });
    await npc.createEmbeddedEntity("OwnedItem", innateSpells);
  }
}

async function buildNPC(data) {
  logger.debug("Importing Icons");
  await updateIcons(data);
  logger.debug("Importing Images");
  await getNPCImage(data);
  // create the new npc
  logger.debug("Importing NPC");
  const options = {
    temporary: true,
    displaySheet: true,
  };
  let npc = await Actor.create(data, options);
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

const cleanUp = async (npc) => {
  await npc.delete();
};

async function parseNPC (data) {
  let npc = await buildNPC(data);
  // spell additions here?
  await addNPCToCompendium(npc);
  // await cleanUp(npc);
  return npc;
};

export function addNPC(data) {
  return new Promise((resolve, reject) => {
    parseNPC(data)
      .then((npc) => {
        resolve(npc);
      })
      .catch((error) => {
        logger.error(`error parsing NPC: ${error}`);
        reject(error);
      });
  });
};

