import getCharacter from "./character/index.js";
import getActions from "./features/actions.js";
import getFeatures from "./features/features.js";
import { removeActionFeatures } from "./features/special.js";
import { getClasses } from "./classes/index.js";
import { getCharacterSpells } from "./spells/getCharacterSpells.js";
import { getItemSpells } from "./spells/getItemSpells.js";
import { getDDBRace } from "../muncher/races/races.js";
import getInventory from "./inventory/index.js";
import getSpecial from "./special/index.js";
import logger from "../logger.js";
import { getResourcesDialog } from "./character/resources.js";
import { createGMMacros } from "../effects/macros.js";

export async function parseJson(currentActorId, ddb, resourceSelection = true) {
  try {
    if (game.settings.get("ddb-importer", "character-update-policy-add-spell-effects")) await createGMMacros();
    logger.debug("Starting core character parse");
    let character = await getCharacter(ddb);
    if (resourceSelection) {
      logger.debug("Character resources");
      character = await getResourcesDialog(currentActorId, ddb, character);
    }
    logger.debug("Character parse complete");
    let race = await getDDBRace(ddb);
    logger.debug("Race parse complete");
    let classes = await getClasses(ddb, character);
    logger.debug("Classes parse complete");
    let features = [race, ...await getFeatures(ddb, character, classes)];
    logger.debug("Feature parse complete");
    let spells = getCharacterSpells(ddb, character);
    logger.debug("Character Spells parse complete");
    let actions = await getActions(ddb, character, classes);
    logger.debug("Action parse complete");
    let itemSpells = getItemSpells(ddb, character);
    logger.debug("Item Spells parse complete");
    let inventory = await getInventory(ddb, character, itemSpells);
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
