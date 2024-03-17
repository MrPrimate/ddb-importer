import FolderHelper from "../../lib/FolderHelper.js";
import Iconizer from "../../lib/Iconizer.js";
import logger from "../../logger.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";

async function getCompendiumItemSpells(spells) {
  const getItemsOptions = {
    looseMatch: true,
    keepId: true,
    deleteCompendiumId: false,
  };
  const itemImporter = new DDBItemImporter("spell", spells);
  await itemImporter.init();
  const compendiumSpells = await itemImporter.loadPassedItemsFromCompendium(spells, getItemsOptions);
  itemImporter.removeItems(compendiumSpells);
  const srdSpells = await itemImporter.getSRDCompendiumItems(true, true);
  const foundSpells = compendiumSpells.concat(srdSpells);

  const itemSpells = foundSpells.map((result) => {
    return {
      magicItem: {
        _id: result._id,
        id: result._id,
        pack: result.flags.ddbimporter.pack,
        img: result.img,
        name: result.name,
        flatDc: result.flags.ddbimporter.dndbeyond?.overrideDC,
        dc: result.flags.ddbimporter.dndbeyond?.dc,
      },
      _id: result._id,
      name: result.name,
      compendium: true,
    };
  });

  return [foundSpells, itemSpells];
}

/**
 * This adds magic item spells to an item, by looking in compendium or from a world.
 */
export async function addMagicItemSpells(input) {
  // check for existing spells in spell compendium & srdCompendium
  const [compendiumSpells, compendiumItemSpells] = await getCompendiumItemSpells(input.itemSpells);
  // if spells not found create world version
  const itemImporter = new DDBItemImporter("spell", input.itemSpells);
  itemImporter.removeItems(compendiumSpells);
  const remainingSpells = {
    itemSpells: await Iconizer.updateMagicItemImages(itemImporter.documents),
  };
  const worldSpells = remainingSpells.length > 0
    ? await FolderHelper.updateFolderItems("itemSpells", remainingSpells)
    : [];
  const itemSpells = worldSpells.concat(compendiumItemSpells);

  logger.debug("itemSpells fetched", itemSpells);

  // scan the inventory for each item with spells and copy the imported data over
  input.inventory.forEach((item) => {
    logger.debug("replacing spells for item", item);
    const magicItemsSpells = foundry.utils.getProperty(item, "flags.magicitems.spells");
    if (magicItemsSpells) {
      logger.debug("item.flags.magicitems.spells", magicItemsSpells);
      for (let [i, spell] of Object.entries(magicItemsSpells)) {
        const itemSpell = itemSpells.find((iSpell) => iSpell.name === spell.name
          && (iSpell.compendium || iSpell.magicItem.subFolder === item.name)
        );
        if (itemSpell) {
          for (const [key, value] of Object.entries(itemSpell.magicItem)) {
            item.flags.magicitems.spells[i][key] = value;
          }
        } else if (!game.user.can("ITEM_CREATE")) {
          ui.notifications.warn(`Magic Item ${item.name} cannot be enriched because of lacking player permissions`);
        } else {
          ui.notifications.warn(`Magic Item ${item.name}: cannot add spell ${spell.name}`);
        }
      }
    }
    // {
    //   magicItem: {
    //     _id: result._id,
    //     id: result._id,
    //     pack: result.flags.ddbimporter.pack,
    //     img: result.img,
    //     name: result.name,
    //     flatDc: result.flags.ddbimporter.dndbeyond?.overrideDC,
    //     dc: result.flags.ddbimporter.dndbeyond?.dc,
    //   },
    //   _id: result._id,
    //   name: result.name,
    //   compendium: true,
    // };
    const itemsWithSpells = foundry.utils.getProperty(item, "flags.items-with-spells-5e.item-spells");
    if (itemsWithSpells) {
      logger.debug("item.flags.items-with-spells-5e.item-spells", item.flags["items-with-spells-5e"]["item-spells"]);
      itemsWithSpells.forEach((spellData, i) => {
        const itemSpell = itemSpells.find((iSpell) => iSpell.name === spellData.flags.ddbimporter.spellName
          && (iSpell.compendium || iSpell.magicItem.subFolder === item.name)
        );
        if (itemSpell) {
          item.flags["items-with-spells-5e"]["item-spells"][i].uuid = `Compendium.${itemSpell.magicItem.pack}.${itemSpell._id}`;
          if (item._id) {
            foundry.utils.setProperty(item.flags["items-with-spells-5e"]["item-spells"][i], "flags.items-with-spells-5e.item-spells.parent-item", item._id);
          }
        } else if (!game.user.can("ITEM_CREATE")) {
          ui.notifications.warn(`Magic Item ${item.name} cannot be enriched because of lacking player permissions`);
        } else {
          ui.notifications.warn(`Magic Item ${item.name}: cannot add spell ${spellData.name}`);
        }
      });
    }
  });
}
