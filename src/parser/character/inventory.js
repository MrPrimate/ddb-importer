/* eslint-disable max-depth */
import DDBCharacter from "../DDBCharacter.js";
import { logger, CompendiumHelper } from "../../lib/_module.mjs";
import GenericSpellFactory from "../spells/GenericSpellFactory.js";
import { DICTIONARY } from "../../config/_module.mjs";
import DDBItem from "../item/DDBItem.js";

// effects support
import { generateEffects } from "../../effects/effects.js";
import { parseInfusion } from "./infusions.js";
import { addRestrictionFlags } from "../../effects/restrictions.js";
import { midiItemEffects } from "../../effects/specialEquipment.js";

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

  const spellCompendium = CompendiumHelper.getCompendiumType("spells", false);
  await DDBItem.prepareSpellCompendiumIndex();
  let i = 0;
  const length = this.source.ddb.character.inventory.length;
  for (let ddbItem of this.source.ddb.character.inventory) {

    if (notifier) notifier(`Parsing item ${++i} of ${length}: ${ddbItem.definition.name}`, true);
    const itemParser = new DDBItem({
      characterManager: this,
      ddbItem,
      isCompendium: isCompendiumItem,
      spellCompendium,
      notifier,
    });
    await itemParser.build();

    logger.debug(`Item ${ddbItem.definition.name} parsed`, itemParser);

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
        if (activity.effects?.length !== 0) continue;
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


DDBCharacter.prototype._generateInventory = async function _generateInventory() {

  this.raw.itemSpells = await GenericSpellFactory.getItemSpells(this.source.ddb, this.raw.character, {
    generateSummons: this.generateSummons,
  });
  logger.debug("Item Spells parse complete");
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
