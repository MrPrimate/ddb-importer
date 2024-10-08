import DDBCharacter from "../DDBCharacter.js";
import logger from "../../logger.js";
import GenericSpellFactory from "../spells/GenericSpellFactory.js";

DDBCharacter.prototype._generateInventory = async function _generateInventory() {

  this.raw.itemSpells = await GenericSpellFactory.getItemSpells(this.source.ddb, this.raw.character);
  logger.debug("Item Spells parse complete");
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
