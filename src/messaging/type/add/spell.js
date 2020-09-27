import utils from "../../../utils.js";
import logger from "../../../logger.js";

const SAVE_ALL = 0;
const SAVE_NONE = 2;
const CLEAN_SPELLS = 2;
const CLEAN_ALL = 3;

const createSpell = async (data) => {
  // get the folder to add this spell into
  const folder = await utils.getFolder("spell");
  data.folder = folder._id;

  // check if there is a Spell with that name in that folder already
  let spell = folder.content ? folder.content.find((spell) => spell.name === data.name) : undefined;
  if (spell) {
    data._id = spell._id;
    // update the current spell
    await spell.update(data);
  } else {
    // create the new spell
    spell = await Item.create(data, {
      temporary: false,
      displaySheet: true,
    });
  }

  return spell;
};

const getCompendium = async () => {
  const compendiumName = await game.settings.get("ddb-importer", "entity-spell-compendium");
  if (compendiumName && compendiumName !== "") {
    const compendium = await game.packs.find((pack) => pack.collection === compendiumName);
    if (compendium) {
      return compendium;
    }
  }
  return undefined;
};

const addSpellToCompendium = async (spell, name) => {
  // decide wether to save it into the compendium
  if (game.settings.get("ddb-importer", "entity-import-policy") !== SAVE_NONE) {
    // update existing (1) or overwrite (0)
    const compendium = await getCompendium();
    if (compendium) {
      let index = await compendium.getIndex();
      let entity = index.find((entity) => entity.name.toLowerCase() === name.toLowerCase());
      if (entity) {
        if (SAVE_ALL) {
          const compendiumSpell = JSON.parse(JSON.stringify(spell));
          compendiumSpell.data._id = entity._id;
          await compendium.updateEntity(compendiumSpell.data);
        }
      } else {
        await compendium.createEntity(spell.data);
      }
    } else {
      logger.error("Error opening compendium, check your settings");
    }
  }
};

const cleanUp = async (spell) => {
  // cleaning up after imports
  const cleanupAfterImport =
    game.settings.get("ddb-importer", "entity-cleanup-policy") === CLEAN_ALL ||
    game.settings.get("ddb-importer", "entity-cleanup-policy") === CLEAN_SPELLS;
  if (cleanupAfterImport) {
    await spell.delete();
  }
};

const parseSpell = async (body) => {
  let spell = await createSpell(body.data);
  await addSpellToCompendium(spell, body.data.name);
  await cleanUp(spell);
  return spell;
};

let addSpell = (body) => {
  return new Promise((resolve, reject) => {
    parseSpell(body)
      .then((spell) => {
        resolve(spell.data);
      })
      .catch((error) => {
        logger.error(`error parsing spell: ${error}`);
        reject(error);
      });
  });
};

export default addSpell;
