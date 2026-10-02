
import DDBCharacter from "../DDBCharacter";
import { logger, utils, CompendiumHelper } from "../../lib/_module";
import GenericSpellFactory from "../spells/GenericSpellFactory";
import { DICTIONARY } from "../../config/_module";
import DDBItem from "../item/DDBItem";
import { ensureItemSpellsInCompendium } from "./itemSpells";


type SupportedOverrideKey = "name" | "weight" | "price";

/**
 * Items DDB ships as one copy per state or mode, which import as a single item (the GalvanizedClaw
 * and Hoopak enrichers, the item/_TrickWeapon.ts weapons and Precipit's states). Each list is in order of preference.
 * A character holding several copies keeps one: the first attuned copy, or the first copy held
 * when none is attuned. The Transformed copy of a trick weapon comes last, as the Transformed state
 * is then assumed not to be active.
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
];

/** DDB inventory ids of the state copies a character import should not keep. */
export function droppedStateCopyIds(inventory: Pick<IDDBInventoryItem, "id" | "isAttuned" | "definition">[]): Set<number> {
  const dropped = new Set<number>();
  for (const copies of STATE_COPIES) {
    const held = copies.flatMap((name) => inventory.filter((i) => utils.nameString(i.definition.name) === name));
    if (held.length < 2) continue;
    const keep = held.find((i) => i.isAttuned) ?? held[0];
    for (const item of held) if (item !== keep) dropped.add(item.id);
  }
  return dropped;
}

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
  const droppedCopies = isCompendiumItem ? new Set<number>() : droppedStateCopyIds(ddb.character.inventory);
  await DDBItem.prepareSpellCompendiumIndex();
  let i = 0;
  const length = ddb.character.inventory.length;
  for (const ddbItem of ddb.character.inventory) {
    if (discardMissingContainerItems && ddb.character.inventory.some((i) => i.id === ddbItem.containerEntityId && i.definition.isContainer === false)
    ) {
      logger.warn(`Skipping item ${ddbItem.definition.name} as it is in a container we don't have. This is, in most cases, harmless.`, {
        ddbItem,
        container: ddb.character.inventory.filter((i) => i.id === ddbItem.containerEntityId),
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
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to generate inventory, no DDB source data");
    return;
  }
  this.raw.itemSpells = await GenericSpellFactory.getItemSpells(ddb, this.raw.character, {
    generateSummons: this.generateSummons,
  });
  logger.debug("Item Spells parse complete");
  // compendium (mule) characters never link item spells, see DDBItem #basicMagicItem
  const isCompendiumCharacter = this.isMuncher
    || (foundry.utils.getProperty(this.raw.character, "flags.ddbimporter.compendium") as boolean ?? false);
  if (!isCompendiumCharacter && this.ensureItemSpellsInCompendium) {
    await ensureItemSpellsInCompendium(ddb, this.raw.itemSpells, { generateSummons: this.generateSummons });
  }
  this.raw.inventory = await this.getInventory();
  logger.debug("Inventory parse complete");
};
