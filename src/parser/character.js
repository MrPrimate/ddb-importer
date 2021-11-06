import getCharacter from "./character/index.js";
import getActions from "./features/actions.js";
import getFeatures from "./features/features.js";
import { removeActionFeatures } from "./features/special.js";
import getClasses from "./classes/index.js";
import { getCharacterSpells } from "./spells/getCharacterSpells.js";
import { getItemSpells } from "./spells/getItemSpells.js";
import { getDDBRace } from "../muncher/races/races.js";
import getInventory from "./inventory/index.js";
import getSpecial from "./special/index.js";
import logger from "../logger.js";

export async function parseJson(ddb) {
  try {
    logger.debug("Starting core character parse");
    let character = getCharacter(ddb);
    logger.debug("Character parse complete");
    let race = await getDDBRace(ddb);
    logger.debug("Race parse complete");
    let features = [race, ...getFeatures(ddb, character)];
    logger.debug("Feature parse complete");
    let classes = getClasses(ddb);
    logger.debug("Classes parse complete");
    let spells = getCharacterSpells(ddb, character);
    logger.debug("Character Spells parse complete");
    let actions = getActions(ddb, character);
    logger.debug("Action parse complete");
    let itemSpells = getItemSpells(ddb, character);
    logger.debug("Item Spells parse complete");
    let inventory = getInventory(ddb, character, itemSpells);
    logger.debug("Inventory parse complete");

    [actions, features] = removeActionFeatures(actions, features);

    let characterJSON = {
      character,
      features,
      classes,
      inventory,
      spells,
      actions,
      itemSpells,
    };

    getSpecial(characterJSON);

    return characterJSON;
  } catch (error) {
    logger.error(error);
    logger.error("Error during parse:", error.message);
    throw (error);
  }
}
