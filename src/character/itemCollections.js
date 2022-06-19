export function getItemCollectionItems(actor) {
  if (!game.modules.get("itemcollection")?.active) return [];
  const topLevelItems = actor.items
    .filter((item) =>
      hasProperty(item.data, "flags.ddbimporter.id") &&
      hasProperty(item.data, "flags.ddbimporter.containerEntityId") &&
      item.data.flags.ddbimporter.containerEntityId === ddb.character.id &&
      !item.data.flags.ddbimporter?.ignoreItemImport
    );

  const itemCollectionItems = topLevelItems
    .map((topLevelItem) => {
      const items = (getProperty(topLevelItem.data.flags, "itemcollection.contentsData") ?? [])
        .map((item) => {
          const containerId = getProperty(topLevelItem.data, "flags.ddbimporter.id");
          setProperty(item, "flags.ddbimporter.containerEntityId", containerId);
          return item;
        });
      return items;
    })
    .flat();
  return itemCollectionItems;
}

/* eslint-disable no-await-in-loop */
export async function addContainerItemsToContainers(ddb, actor) {
  if (!game.modules.get("itemcollection")?.active || !game.settings.get("ddb-importer", "character-update-policy-use-item-containers")) return;

  const topLevelItems = actor.items
    .filter((item) =>
      hasProperty(item.data, "flags.ddbimporter.id") &&
      hasProperty(item.data, "flags.ddbimporter.containerEntityId") &&
      item.data.flags.ddbimporter.containerEntityId === ddb.character.id &&
      !item.data.flags.ddbimporter?.ignoreItemImport
    );

  for (const topLevelItem of topLevelItems) {
    const itemsToImport = actor.items
      .filter((item) =>
        hasProperty(item.data, "flags.ddbimporter.containerEntityId") &&
        item.data.flags.ddbimporter.containerEntityId === topLevelItem.data.flags.ddbimporter.id
      )
      .map((item) => {
        return item.data.toJSON();
      });

    if (itemsToImport.length > 0) {
      const itemsToDelete = itemsToImport.map((item) => item._id);
      await actor.deleteEmbeddedDocuments("Item", itemsToDelete);
      await topLevelItem.createEmbeddedDocuments("Item", itemsToImport, { keepId: true });
    }

  }
}

export async function addContainerItemsToActor(ddb, actor) {
  const topLevelItems = actor.items
    .filter((item) =>
      hasProperty(item.data, "flags.ddbimporter.id") &&
      hasProperty(item.data, "flags.ddbimporter.containerEntityId") &&
      item.data.flags.ddbimporter.containerEntityId === ddb.character.id &&
      hasProperty(item.data, "flags.itemcollection.contentsData") &&
      item.data.flags.itemcollection.contentsData.length > 0 &&
      !item.data.flags.ddbimporter?.ignoreItemImport
    );

  for (const topLevelItem of topLevelItems) {
    const itemsToImport = duplicate(getProperty(topLevelItem.data.flags, "itemcollection.contentsData") ?? []);
    const itemsToDelete = itemsToImport.map((item) => item._id);
    // const currency = duplicate(topLevelItem.data.data.currency);
    await topLevelItem.deleteEmbeddedDocuments("Item", itemsToDelete);
    await actor.createEmbeddedDocuments("Item", itemsToImport, { keepId: true });
  }
}
