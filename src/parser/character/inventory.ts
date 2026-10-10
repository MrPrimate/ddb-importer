
import DDBCharacter from "../DDBCharacter";
import { logger, utils, CompendiumHelper } from "../../lib/_module";
import GenericSpellFactory from "../spells/GenericSpellFactory";
import { DICTIONARY, SETTINGS } from "../../config/_module";
import DDBItem from "../item/DDBItem";
import { ensureItemSpellsInCompendium } from "./itemSpells";


/**
 * Items DDB ships as one copy per state or mode, which import as a single item (the GalvanizedClaw,
 * Hoopak and Nightbringer enrichers, the item/_TrickWeapon.ts weapons and Precipit's states). Each list is in order of preference.
 * A character holding several states keeps one: the first attuned copy, or the first copy held
 * when none is attuned. The Transformed copy of a trick weapon comes last, as the Transformed state
 * is then assumed not to be active. Copies sharing the kept copy's name are separate items (two
 * plain Hoopaks), so only the other states are dropped.
 */
const STATE_COPIES = [
  ["Galvanized Claw (Untransformed)", "Galvanized Claw", "Galvanized Claw (Transformed)"],
  ["Hoopak", "Hoopak (Ranged)"],
  ["Forcebreaker Hoopak", "Forcebreaker Hoopak (Ranged)"],
  ["Hoopak of Throne's Command", "Hoopak of Throne's Command (Ranged)"],
  ["Dream Executioner (Scythe)", "Dream Executioner", "Dream Executioner (Maul)"],
  ["Orphan's Cradle (Morningstar)", "Orphan's Cradle", "Orphan's Cradle (Transformed)"],
  ["Ravenous Gazer (Glaive)", "Ravenous Gazer", "Ravenous Gazer (Transformed)"],
  ["Revelations (Cleaver)", "Revelations", "Revelations (Whip)"],
  ["Shard of Moonlight (Longsword)", "Shard of Moonlight", "Shard of Moonlight (Greatsword)"],
  ["Unstable Crumbler (Cannon)", "Unstable Crumbler", "Unstable Crumbler (Maul)"],
  ["Dawn and Dusk (Mace)", "Dawn and Dusk", "Dawn and Dusk (Sickle)"],
  // the Blunderbuss copy is in both states, so it reads as Untransformed
  ["Meat Hookshot (Sickle)", "Meat Hookshot", "Meat Hookshot (Blunderbuss)", "Meat Hookshot (Battleaxe)"],
  // the base item is in no state, so a state copy is kept over it only when attuned
  ["Precipit, the Formless", "Precipit, the Formless (Gas)", "Precipit, the Formless (Liquid)", "Precipit, the Formless (Solid)"],
  // the Nightbringer enricher builds the evil-only properties into both records
  ["Nightbringer", "Nightbringer (Evil Alignment)"],
  // the TordalfrsRebuttal enricher builds every level into each record, gated by character level
  [
    "Tordalfr's Rebuttal", "Tordalfr's Rebuttal (Lv. 1)", "Tordalfr's Rebuttal (Lv. 5)",
    "Tordalfr's Rebuttal (Lv. 9)", "Tordalfr's Rebuttal (Lv. 13)", "Tordalfr's Rebuttal (Lv. 17)",
  ],
];

/** DDB inventory ids of the state copies a character import should not keep. */
export function droppedStateCopyIds(inventory: Pick<IDDBInventoryItem, "id" | "isAttuned" | "definition">[]): Set<number> {
  const dropped = new Set<number>();
  for (const copies of STATE_COPIES) {
    const held = copies.flatMap((name) => inventory.filter((i) => utils.nameString(i.definition.name) === name));
    if (held.length < 2) continue;
    const keep = held.find((i) => i.isAttuned) ?? held[0];
    const keptName = utils.nameString(keep.definition.name);
    for (const item of held) {
      if (utils.nameString(item.definition.name) !== keptName) dropped.add(item.id);
    }
  }
  return dropped;
}

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
  const droppedCopies = isCompendiumItem ? new Set<number>() : droppedStateCopyIds(this.source.ddb.character.inventory);
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

    if (droppedCopies.has(ddbItem.id)) {
      logger.debug(`Skipping ${ddbItem.definition.name}: the character also holds the other copy of this item`, { ddbItem });
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
    // a missing compendium spell only warns inside ensureItemSpellsInCompendium; this guards the
    // munch itself failing. The item keeps its fallback handling in DDBItem #basicMagicItem.
    try {
      await ensureItemSpellsInCompendium(this.source.ddb, this.raw.itemSpells, { generateSummons: this.generateSummons });
    } catch (err) {
      logger.warn(`Unable to add missing item spells to the spells compendium: ${err.message}`, { err });
    }
  }
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
