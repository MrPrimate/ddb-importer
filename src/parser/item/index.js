import DICTIONARY from "../../dictionary.js";
import DDBCharacter from "../DDBCharacter.js";

// magic items support
import MagicItemMaker from "./MagicItemMaker.js";

import { fixItems } from "./special.js";

// effects support
import { generateEffects } from "../../effects/effects.js";
import { parseInfusion } from "./infusions.js";
import { addRestrictionFlags } from "../../effects/restrictions.js";
import { midiItemEffects } from "../../effects/specialEquipment.js";


import DDBItem from "./DDBItem.js";
import logger from "../../logger.js";


// TO DO: revisit to break up item parsing
// eslint-disable-next-line complexity
DDBCharacter.prototype.getInventory = async function getInventory() {

  let items = [];

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
      characterManager: this,
      ddbItem,
      isCompendium: isCompendiumItem,
    });

    await itemParser.build();

    if (itemParser.data) {
      const itemSpells = this.raw.spells;

      if (game.modules.get("magicitems")?.active) {
        ddbItem.data.flags.magicitems = MagicItemMaker.parseMagicItemsModule(itemParser, itemSpells, !isCompendiumItem, true);
      } else if (game.modules.get("items-with-spells-5e")?.active) {
        MagicItemMaker.parseItemsWithSpellsModule(itemParser, itemSpells, !isCompendiumItem);
      } else {
        logger.debug(`$Item.name} Using basic magic item data`, {
          item: foundry.utils.deepClone(ddbItem.data),
          data: ddbItem.ddbItem,
          itemSpells,
          isCompendiumItem,
        });
      }
    }

    let item = Object.assign({}, itemParser.data);

    if (item) {
      if (!item.effects) item.effects = [];
      if (!item.name || item.name === "") item.name = "Item";
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
      item = await addRestrictionFlags(item, addAutomationEffects);

      if (!isCompendiumItem) item = parseInfusion(this.source.ddb, this.raw.character, item, ddbItem, isCompendiumItem);

      //todo: refactor midi effects
      // if (addAutomationEffects) item = await midiItemEffects(item);

      // to do: we want to move this into item parser build
      let effect = itemParser.enricher.createEffect();
      if (effect) {
        item.effects.push(effect);
      }

      items.push(item);
    }
  }

    // TODO: rework for activities

  fixItems(items);

  // hack till better impelementation
  for (const item of items) {
    if (item.effects.length > 0) {
      for (const activityId of Object.keys(item.system.activities)) {
        const activity = item.system.activities[activityId];
        if (activity.effects.length !== 0) continue;
        for (const effect of item.effects) {
          const effectId = effect._id ?? foundry.utils.randomID();
          effect._id = effectId;
          activity.effects.push({ _id: effectId });
        }
        item.system.activities[activityId] = activity;
      }
    }
  }

  // this.updateItemIds(items);
  return items;
};
