/* eslint-disable no-await-in-loop */

import DICTIONARY from "../dictionary.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import logger from "../logger.js";

// Function to calculate the new price
export async function calculatePrice(rarity, consumable = false) {
  if (!DICTIONARY.equipment.priceFormulas[rarity]) return null;
  const roll = new Roll(DICTIONARY.equipment.priceFormulas[rarity]);
  await roll.evaluate({ async: true });
  return consumable ? parseInt(roll.total / 2) : roll.total;
}

// Function to update item prices
export async function updateItemPrices({ keepExistingNonDDBPrices = true, keepExistingDDBPrices = true, compendiumName = null } = {}) {
  const packName = compendiumName ?? (await CompendiumHelper.getCompendiumLabel("equipment"));
  const pack = CompendiumHelper.getCompendium(packName);
  pack.configure({ locked: false });

  if (!pack) {
    logger.error("Compendium not found:", packName);
    return [];
  }

  const items = (await pack.getIndex({
    fields: [
      "name",
      "type",
      "system.rarity",
      "system.price.value",
      "flags.ddbimporter.price",
    ],
  })).filter((i) => {
    const rarity = i.system.rarity;
    if (!(rarity in DICTIONARY.equipment.priceFormulas)) {
      logger.info(`No update needed for ${i.name}, item has no rarity`);
      return false;
    }
    const gpPrice = i.system.price.value;
    const noGpValue = (gpPrice === undefined || gpPrice === null || gpPrice === 0);

    if (noGpValue) return true;
    const existingDDBPrice = foundry.utils.getProperty(i, "flags.ddbimporter.price.xgte");
    // console.warn(`checking ${i.name}`, { existingDDBPrice, keepExistingDDBPrices, keepExistingNonDDBPrices, i });
    if (!keepExistingDDBPrices && existingDDBPrice) return true;
    if (!keepExistingNonDDBPrices && !existingDDBPrice) return true;
    logger.info(`No update needed for ${i.name}`);
    return false;
  });

  const updates = [];

  // const items = await pack.getDocuments();

  for (let item of items) {
    const rarity = item.system.rarity;
    const gpPrice = item.system.price.value;
    const isConsumable = item.type === "consumable";

    logger.info(`Processing ${item.name}: Rarity - ${rarity}, Price - ${gpPrice}, Consumable - ${isConsumable}`);

    const newPrice = keepExistingDDBPrices && foundry.utils.hasProperty(item, "flags.ddbimporter.price.value")
      ? foundry.utils.getProperty(item, "flags.ddbimporter.price.value")
      : await calculatePrice(rarity, isConsumable);
    if (newPrice !== null) {
      logger.info(`Adding update of GP price of ${item.name} (Rarity: ${rarity}) to ${newPrice} gp`);
      updates.push({
        _id: item._id,
        "system.price.value": newPrice,
        "system.price.denomination": "gp",
        "flags.ddbimporter.price": { xgte: true, value: newPrice },
      });
    }
  }

  await Item.updateDocuments(updates, { pack: packName });

  ui.notifications.info(`Attempted to update prices for ${updates.length} items.`);
  return items;
}
