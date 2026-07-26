
import DDBCharacter from "../DDBCharacter";
import { logger, utils, CompendiumHelper } from "../../lib/_module";
import GenericSpellFactory from "../spells/GenericSpellFactory";
import { DICTIONARY } from "../../config/_module";
import DDBItem from "../item/DDBItem";


type SupportedOverrideKey = "name" | "weight" | "price";

function applyItemOverride(
  definition: IDDBItemDefinition,
  key: SupportedOverrideKey,
  value: unknown,
): void {
  switch (key) {
    case "name":
      if (typeof value === "string") definition.name = value;
      break;
    case "weight":
      if (typeof value === "number") definition.weight = value;
      if (typeof value === "string") definition.weight = Number(value);
      break;
    case "price":
      if (typeof value === "number") definition.cost = Number(value);
      if (typeof value === "string") definition.cost = Number(value);
      break;
  }
}

DDBCharacter.prototype.getInventory = async function getInventory(this: DDBCharacter, notifier?: TItemsNotifier): Promise<I5eInventoryItem[]> {

  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to generate inventory, no DDB source data");
    return [];
  }

  const items: I5eInventoryItem[] = [];

  // first, check custom name, price or weight
  ddb.character.characterValues.forEach((cv) => {
    // try to find a matching item based on the characterValues (an array of custom adjustements to different parts of the character)
    const item = ddb.character.inventory.find((item) => item.id == cv.valueId);
    if (item) {
      // check if this property is in the list of supported ones, based on our DICT
      const property = DICTIONARY.item.characterValues.find((entry) => entry.typeId == cv.typeId);
      // unsupported customizations (e.g. notes) have no dictionary entry and are skipped
      if (!property) return;
      // overwrite the name, weight or price with the custom value
      const key = property.value as SupportedOverrideKey;
      if (key === "name" || key === "weight" || key === "price") {
        applyItemOverride(item.definition, key, cv.value);
      }
    }
  });

  // now parse all items
  const isCompendiumItem = foundry.utils.getProperty(this.raw.character, "flags.ddbimporter.compendium") as boolean ?? false;
  const spellCompendium = CompendiumHelper.getCompendiumType("spells", false);

  const discardMissingContainerItems = utils.getSetting<boolean>("character-import-policy-ignore-items-with-non-existing-containers");
  await DDBItem.prepareSpellCompendiumIndex();
  let i = 0;
  const length = ddb.character.inventory.length;
  for (const ddbItem of ddb.character.inventory) {
    if (discardMissingContainerItems && ddb.character.inventory.some((i) => i.id === ddbItem.containerEntityId && i.definition.isContainer === false)
    ) {
      logger.error(`Skipping item ${ddbItem.definition.name} as it is in a container we don't have`, {
        ddbItem,
        container: ddb.character.inventory.filter((i) => i.id === ddbItem.containerEntityId),
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
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to generate inventory, no DDB source data");
    return;
  }
  this.raw.itemSpells = await GenericSpellFactory.getItemSpells(ddb, this.raw.character, {
    generateSummons: this.generateSummons,
  });
  logger.debug("Item Spells parse complete");
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
