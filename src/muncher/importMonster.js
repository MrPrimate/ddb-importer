import utils from "../utils.js";
import logger from "../logger.js";
import DICTIONARY from "../dictionary.js";
import { updateIcons, getImagePath } from "./import.js";

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
}

async function getCompendium() {
  const compendiumName = await game.settings.get("ddb-importer", "entity-monster-compendium");
  if (compendiumName && compendiumName !== "") {
    const compendium = await game.packs.find((pack) => pack.collection === compendiumName);
    if (compendium) {
      return compendium;
    }
  }
  return undefined;
}

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
}


async function getNPCImage(data) {
  // check to see if we have munched flags to work on
  if (!data.flags || !data.flags.monsterMunch || !data.flags.monsterMunch.img) {
    return false;
  }

  let dndBeyondImageUrl = data.flags.monsterMunch.img;
  let dndBeyondTokenImageUrl = data.flags.monsterMunch.tokenImg;
  const npcType = data.data.details.type;
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

  return true;
}

function getSpellEdgeCase(spell, type, edgeCases) {
  const edgeCase = edgeCases.find((edge) => edge.name.toLowerCase() === spell.name.toLowerCase() && edge.type === type);

  if (edgeCase) {
    switch(edgeCase.edge.toLowerCase()) {
      case "self":
      case "self only":
        spell.data.target.type = "self";
        console.debug("spell target changed to self");
        break;
      // no default
    }
    spell.name = `${spell.name} (${edgeCase.edge})`;
    spell.data.description.chat += `\n<p>Special Notes: ${edgeCase.edge}.</p>`;
    spell.data.description.value += `\n<p>Special Notes: ${edgeCase.edge}.</p>`;

    const diceSearch = /(\d+)d(\d+)/;
    const diceMatch = edgeCase.edge.match(diceSearch);
    if (diceMatch) {
      spell.data.damage.parts[0][0] = edgeCase.edge;
    }
  }

}

async function addSpells(data) {
  // check to see if we have munched flags to work on
  if (!data.flags || !data.flags.monsterMunch || !data.flags.monsterMunch.spellList) {
    return;
  }

  const atWill = data.flags.monsterMunch.spellList.atwill;
  const klass = data.flags.monsterMunch.spellList.class;
  const innate = data.flags.monsterMunch.spellList.innate;
  const edgeCases = data.flags.monsterMunch.spellList.edgeCases;

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
      getSpellEdgeCase(spell, "atwill", edgeCases);
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
      getSpellEdgeCase(spell, "class", edgeCases);
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
          getSpellEdgeCase(spell, "innate", edgeCases);
        }
        return spell;
      });
    // eslint-disable-next-line require-atomic-updates
    data.items = data.items.concat(innateSpells);
  }
}

// async function buildNPC(data, srdIconLibrary, iconMap) {
async function buildNPC(data) {
  logger.debug("Importing Images");
  await getNPCImage(data);
  await addSpells(data);
  logger.debug("Importing Icons");
  // eslint-disable-next-line require-atomic-updates
  data.items = await updateIcons(data.items, false);
  // create the new npc
  logger.debug("Importing NPC");
  const options = {
    temporary: true,
    displaySheet: true,
  };
  let npc = await Actor.create(data, options);
  return npc;
}

async function parseNPC (data) {
  let npc = await buildNPC(data);
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

