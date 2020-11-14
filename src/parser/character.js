import getCharacter from "./character/index.js";
import getActions from "./features/actions.js";
import getFeatures from "./features/features.js";
import getClasses from "./classes/index.js";
import { getCharacterSpells } from "./spells/getCharacterSpells.js";
import { getItemSpells } from "./spells/getItemSpells.js";
import getInventory from "./inventory/index.js";
import getSpecial from "./special/index.js";
import logger from "../logger.js";

export function parseJson(ddb) {
  try {
    let character = getCharacter(ddb);
    logger.debug("Character parse complete");
    let features = getFeatures(ddb, character);
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

    let characterJSON = {
      character: character,
      features: features,
      classes: classes,
      inventory: inventory,
      spells: spells,
      actions: actions,
      itemSpells: itemSpells,
    };

    getSpecial(characterJSON);

    return characterJSON;
  }
  catch (error) {
    logger.error(error);
    logger.error( "Error during parse:", error.message );
    throw( error );
  }
}
