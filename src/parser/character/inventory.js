import DDBCharacter from "../DDBCharacter.js";
import { getItemSpells } from "../spells/getItemSpells.js";
import logger from "../../logger.js";

DDBCharacter.prototype._generateInventory = async function _generateInventory() {

  //TODO: remove this after activities processing
  this.raw.itemSpells = [];
  this.raw.inventory = [];
  return;
  this.raw.itemSpells = await getItemSpells(this.source.ddb, this.raw.character);
  logger.debug("Item Spells parse complete");
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
