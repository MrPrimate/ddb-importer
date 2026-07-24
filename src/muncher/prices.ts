
import { DICTIONARY } from "../config/_module";
import { logger, CompendiumHelper } from "../lib/_module";

// Function to calculate the new price
export async function calculatePrice(rarity: string, consumable = false) {
  if (!DICTIONARY.equipment.priceFormulas[rarity]) return null;
  const roll = new Roll(DICTIONARY.equipment.priceFormulas[rarity]);
  await roll.evaluate();
  const total = roll.total;
  if (total === undefined) {
    logger.warn(`Price roll for rarity ${rarity} did not evaluate to a total`);
    return null;
  }
  return consumable ? Math.floor(total / 2) : total;
}

const UPDATE_PRICE_INDEX_FIELDS = [
  "name",
  "type",
  "system.rarity",
  "system.price.value",
  "flags.ddbimporter.price",
];

interface IUpdatePriceIndexItem {
  _id: string;
  uuid: string;
  name: string;
  type: string;
  system: {
    price: I5ePrice;
    rarity: string;
  };
  flags: {
    ddbimporter: {
      price: IDDBImporterFlagsPrice;
    };
  };
}

// Function to update item prices
export async function updateItemPrices({ keepExistingNonDDBPrices = true, keepExistingDDBPrices = true, compendiumName = null }:{
  keepExistingNonDDBPrices?: boolean;
  keepExistingDDBPrices?: boolean;
  compendiumName?: string | null;
} = {}) {
  const packName = compendiumName ?? CompendiumHelper.getCompendiumLabel("equipment");
  const pack = CompendiumHelper.getCompendium(packName, false);
  if (!pack) {
    logger.error("Compendium not found:", packName);
    return [];
  }
  pack.configure({ locked: false });

  const items = (await pack.getIndex({
    fields: UPDATE_PRICE_INDEX_FIELDS,
  })) as unknown as IUpdatePriceIndexItem[];
  const filteredItems = items.filter((i) => {
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

  for (const item of filteredItems) {
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

  await Item.updateDocuments(updates as unknown as Item.UpdateInput[], { pack: packName });

  ui.notifications.info(`Attempted to update prices for ${updates.length} items.`);
  return filteredItems;
}
