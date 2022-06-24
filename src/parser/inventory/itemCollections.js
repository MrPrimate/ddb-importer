// this function enriches a bunch of items for the item collection module
// the actual moving of items to containers is done after the actor is imported
// this just adds some needed flags to the items
export function fixForItemCollections(ddb, items) {
  const isItemCollectionsInstalled = game.modules.get("itemcollection")?.active;

  if (!isItemCollectionsInstalled) return items;

  items.forEach((item) => {
    if (getProperty(item, "flags.ddbimporter.dndbeyond.isContainer") === true) {
      item.type = "backpack";
    }
    if (item.type === "backpack") {
      setProperty(item, "flags.itemcollection.bagWeight", item.system.weight);
      setProperty(item, "flags.itemcollection.bagPrice", item.system.cost);
      setProperty(item, "flags.core.sheetClass", "dnd5e.ItemSheet5eWithBags");
    }
    if (hasProperty(item, "flags.ddbimporter.id") &&
      hasProperty(item, "flags.ddbimporter.containerEntityId") &&
      item.flags.ddbimporter.containerEntityId === ddb.character.id
    ) {
      setProperty(item, "flags.itemcollection.contentsData", []);
    }
  });

  return items;
}

