
import DDBCharacter from "../DDBCharacter";
import { logger, CompendiumHelper } from "../../lib/_module";
import GenericSpellFactory from "../spells/GenericSpellFactory";
import { DICTIONARY, SETTINGS } from "../../config/_module";
import DDBItem from "../item/DDBItem";


DDBCharacter.prototype.getInventory = async function getInventory(this: DDBCharacter, notifier = null) {

  const items = [];

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
  const isCompendiumItem = foundry.utils.getProperty(this.raw.character, "flags.ddbimporter.compendium") ?? false;
  const spellCompendium = CompendiumHelper.getCompendiumType("spells", false);

  const discardMissingContainerItems = game.settings.get(SETTINGS.MODULE_ID, "character-import-policy-ignore-items-with-non-existing-containers");
  await DDBItem.prepareSpellCompendiumIndex();
  let i = 0;
  const length = this.source.ddb.character.inventory.length;
  for (const ddbItem of this.source.ddb.character.inventory) {
    if (discardMissingContainerItems && this.source.ddb.character.inventory.some((i) => i.id === ddbItem.containerEntityId && i.definition.isContainer === false)
    ) {
      logger.error(`Skipping item ${ddbItem.definition.name} as it is in a container we don't have`, {
        ddbItem,
        container: this.source.ddb.character.inventory.filter((i) => i.id === ddbItem.containerEntityId),
      });
      continue;
    }

    if (notifier) notifier(`Parsing item ${++i} of ${length}: ${ddbItem.definition.name}`, { nameField: true });
    const itemParser = new DDBItem({
      characterManager: this,
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
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
