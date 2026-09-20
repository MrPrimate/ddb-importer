
import DDBCharacter from "../DDBCharacter";
import { logger, CompendiumHelper } from "../../lib/_module";
import GenericSpellFactory from "../spells/GenericSpellFactory";
import { DICTIONARY, SETTINGS } from "../../config/_module";
import DDBItem from "../item/DDBItem";
import { ensureItemSpellsInCompendium } from "./itemSpells";


DDBCharacter.prototype.getInventory = async function getInventory(this: DDBCharacter, notifier = null): Promise<I5eInventoryItem[]> {

  const items: I5eInventoryItem[] = [];

  // first, check custom name, price or weight
  this.source.ddb.character.characterValues.forEach((cv) => {
    // try to find a matching item based on the characterValues (an array of custom adjustements to different parts of the character)
    const item = this.source.ddb.character.inventory.find((item) => item.id === cv.valueId);
    if (item) {
      // check if this property is in the list of supported ones, based on our DICT
      const property = DICTIONARY.item.characterValues.find((entry) => entry.typeId === cv.typeId);
      // overwrite the name, weight or price with the custom value
      if (property && cv.value.length !== 0) item.definition[property.value] = cv.value;
    }
  });

  // now parse all items
  const isCompendiumItem = foundry.utils.getProperty(this.raw.character, "flags.ddbimporter.compendium") as boolean ?? false;
  const spellCompendium = CompendiumHelper.getCompendiumType("spells", false);

  const discardMissingContainerItems = game.settings.get(SETTINGS.MODULE_ID, "character-import-policy-ignore-items-with-non-existing-containers");
  await DDBItem.prepareSpellCompendiumIndex();
  let i = 0;
  const length = this.source.ddb.character.inventory.length;
  for (const ddbItem of this.source.ddb.character.inventory) {
    if (discardMissingContainerItems && this.source.ddb.character.inventory.some((i) => i.id === ddbItem.containerEntityId && i.definition.isContainer === false)
    ) {
      logger.warn(`Skipping item ${ddbItem.definition.name} as it is in a container we don't have. This is, in most cases, harmless.`, {
        ddbItem,
        container: this.source.ddb.character.inventory.filter((i) => i.id === ddbItem.containerEntityId),
      });
      continue;
    }

    if (notifier) notifier(`Parsing item ${++i} of ${length}: ${ddbItem.definition.name}`, { nameField: true });
    const itemParser = new DDBItem({
      ddbCharacter: this,
      ddbItem,
      isCompendium: isCompendiumItem,
      spellCompendium,
      notifier,
    });
    await itemParser.build();

    logger.debug(`Item ${ddbItem.definition.name} parsed`, itemParser);

    if (!isCompendiumItem) {
      // parse any infusion data for characters
      itemParser.processInfusion();
    }
    const item = Object.assign({}, itemParser.data);
    items.push(item);
  }

  // this.updateItemIds(items);
  return items;
};


DDBCharacter.prototype._generateInventory = async function _generateInventory(this: DDBCharacter) {
  this.raw.itemSpells = await GenericSpellFactory.getItemSpells(this.source.ddb, this.raw.character, {
    generateSummons: this.generateSummons,
  });
  logger.debug("Item Spells parse complete");
  // compendium (mule) characters are handled by the muncher, which imports spells itself
  const isCompendiumCharacter = this.isMuncher
    || (foundry.utils.getProperty(this.raw.character, "flags.ddbimporter.compendium") as boolean ?? false);
  if (!isCompendiumCharacter && this.ensureItemSpellsInCompendium) {
    // on this branch a spell the compendium lacks still falls back to the item spell handling in
    // DDBItem #basicMagicItem, so a failure here (player import, no compendium) must not stop the import
    try {
      await ensureItemSpellsInCompendium(this.source.ddb, this.raw.itemSpells, { generateSummons: this.generateSummons });
    } catch (err) {
      logger.warn(`Unable to add missing item spells to the spells compendium: ${err.message}`, { err });
    }
  }
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
