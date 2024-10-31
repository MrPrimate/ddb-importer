import DICTIONARY from "../../dictionary.js";
import DDBCharacter from "../DDBCharacter.js";

// magic items support
import MagicItemMaker from "./MagicItemMaker.js";

// effects support
import { generateEffects } from "../../effects/effects.js";
import { parseInfusion } from "./infusions.js";
import { addRestrictionFlags } from "../../effects/restrictions.js";
import { midiItemEffects } from "../../effects/specialEquipment.js";

import DDBItem from "./DDBItem.js";
import logger from "../../logger.js";


// TO DO: revisit to break up item parsing
// eslint-disable-next-line complexity
DDBCharacter.prototype.getInventory = async function getInventory(notifier = null) {

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

  let i = 0;
  const length = this.source.ddb.character.inventory.length;
  for (let ddbItem of this.source.ddb.character.inventory) {

    if (notifier) notifier(`Parsing item ${++i} of ${length}: ${ddbItem.definition.name}`, true);
    const itemParser = new DDBItem({
      characterManager: this,
      ddbItem,
      isCompendium: isCompendiumItem,
    });
    await itemParser.build();

    if (itemParser.data) {
      const itemSpells = this.raw.spells ?? ddbItem.spells ?? [];

      if (game.modules.get("magicitems")?.active) {
        ddbItem.data.flags.magicitems = MagicItemMaker.parseMagicItemsModule(itemParser, itemSpells, !isCompendiumItem, true);
      } else if (game.modules.get("items-with-spells-5e")?.active) {
        MagicItemMaker.parseItemsWithSpellsModule(itemParser, itemSpells, !isCompendiumItem);
      } else {
        logger.debug(`${itemParser.name} Using basic magic item data`, {
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

      // KNOWN_ISSUE_4_0: refactor midi effects
      if (addAutomationEffects) item = await midiItemEffects(item);

      const effects = itemParser.enricher.createEffect();
      item.effects.push(...effects);

      items.push(item);
    }
  }

  for (const item of items) {
    if (item.effects.length > 0 && item.system.activities) {
      for (const activityId of Object.keys(item.system.activities)) {
        const activity = item.system.activities[activityId];
        if (activity.effects.length !== 0) continue;
        if (foundry.utils.getProperty(activity, "flags.ddbimporter.noeffect")) continue;
        for (const effect of item.effects) {
          if (effect.transfer) continue;
          if (foundry.utils.getProperty(effect, "flags.ddbimporter.noeffect")) continue;
          const activityNameRequired = foundry.utils.getProperty(effect, "flags.ddbimporter.activityMatch");
          if (activityNameRequired && activity.name !== activityNameRequired) continue;
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
