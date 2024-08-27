import DICTIONARY from "../../dictionary.js";
import DDBCharacter from "../DDBCharacter.js";

// magic items support
import { parseMagicItem } from "./magicify.js";

import { fixItems } from "./special.js";

// effects support
import { generateEffects } from "../../effects/effects.js";
import { parseInfusion } from "./infusions.js";
import { addRestrictionFlags } from "../../effects/restrictions.js";
import { midiItemEffects } from "../../effects/specialEquipment.js";


import DDBItem from "./DDBItem.js";


// TO DO: revisit to break up item parsing
// eslint-disable-next-line complexity
DDBCharacter.prototype.getInventory = async function getInventory() {

  let items = [];

  // TODO: rework for activities

  // first, check custom name, price or weight
  this.source.ddb.character.characterValues.forEach((cv) => {
    // try to find a matching item based on the characterValues (an array of custom adjustements to different parts of the character)
    let item = this.source.ddb.character.inventory.find((item) => item.id === cv.valueId);
    if (item) {
      // check if this property is in the list of supported ones, based on our DICT
      let property = DICTIONARY.item.characterValues.find((entry) => entry.typeId === cv.typeId);
      // overwrite the name, weight or price with the custom value
      if (property && cv.value.length !== 0) item.definition[property.value] = cv.value;
    }
  });

  // now parse all items
  const isCompendiumItem = foundry.utils.getProperty(this.raw.character, "flags.ddbimporter.compendium") ?? false;
  const addAutomationEffects = (isCompendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-item-effects");

  for (let ddbItem of this.source.ddb.character.inventory) {

    const itemParser = new DDBItem({
      ddbData: this.source.ddb,
      ddbItem,
      isCompendium: isCompendiumItem,
      rawCharacter: this.raw.character,
    });

    await itemParser.build();

    let item = Object.assign({}, itemParser.data);

    if (item) {
      // item.name = adjustedName;
      item = parseMagicItem(item, ddbItem, this.raw.itemSpells, isCompendiumItem);
      // item.flags.ddbimporter.originalName = originalName;
      // item.flags.ddbimporter.version = CONFIG.DDBI.version;
      if (!item.effects) item.effects = [];
      if (!item.name || item.name === "") item.name = "Item";

      // if (addEffects) {
      item = generateEffects({
        ddb: this.source.ddb,
        character: this.raw.character,
        ddbItem,
        foundryItem: item,
        isCompendiumItem,
        type: "item",
        description: item.system.description.chat !== ""
          ? item.system.description.chat
          : item.system.description.value,
      });
      // } else if (item.type === "equipment") {
      //   if (foundry.utils.hasProperty(item, "system.armor.type") && ["trinket", "clothing"].includes(item.system.armor.type)) {
      //     item = generateBaseACItemEffect(this.source.ddb, this.raw.character, ddbItem, item, isCompendiumItem);
      //   }
      // } else {
      //   item = generateBaseACItemEffect(this.source.ddb, this.raw.character, ddbItem, item, isCompendiumItem);
      // }
      item = await addRestrictionFlags(item, addAutomationEffects);

      if (!isCompendiumItem) item = parseInfusion(this.source.ddb, this.raw.character, item, ddbItem, isCompendiumItem);
      if (addAutomationEffects) item = await midiItemEffects(item);

      items.push(item);
    }
  }

  fixItems(items);
  this.updateItemIds(items);
  return items;
};
