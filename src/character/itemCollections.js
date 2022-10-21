export function getItemCollectionItems(actor) {
  const characterId = getProperty(actor, "flags.ddbimporter.dndbeyond.characterId");
  if (!game.modules.get("itemcollection")?.active && !Number.isInteger(characterId)) return [];
  const topLevelItems = actor.items
    .filter((item) =>
      hasProperty(item, "flags.ddbimporter.id")
      && hasProperty(item, "flags.ddbimporter.containerEntityId")
      && item.flags.ddbimporter.containerEntityId === parseInt(characterId)
      && !item.flags.ddbimporter?.ignoreItemImport
    );

  const itemCollectionItems = topLevelItems
    .map((topLevelItem) => {
      const containerId = getProperty(topLevelItem, "flags.ddbimporter.id");
      const containerEntityTypeId = getProperty(topLevelItem, "flags.ddbimporter.entityTypeId");
      const items = (getProperty(topLevelItem.flags, "itemcollection.contentsData") ?? [])
        .map((item) => {
          setProperty(item, "flags.ddbimporter.containerEntityId", containerId);
          setProperty(item, "flags.ddbimporter.containerEntityTypeId", containerEntityTypeId);
          setProperty(item, "flags.ddbimporter.updateDocumentId", topLevelItem.id);
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
      hasProperty(item, "flags.ddbimporter.id")
      && hasProperty(item, "flags.ddbimporter.containerEntityId")
      && item.flags.ddbimporter.containerEntityId === ddb.character.id
      && !item.flags.ddbimporter?.ignoreItemImport
    );

  for (const topLevelItem of topLevelItems) {
    const itemsToImport = actor.items
      .filter((item) =>
        hasProperty(item, "flags.ddbimporter.containerEntityId")
        && item.flags.ddbimporter.containerEntityId === topLevelItem.flags.ddbimporter.id
      )
      .map((item) => {
        return duplicate(item);
      });

    if (itemsToImport.length > 0) {
      const itemsToDelete = itemsToImport.map((item) => item._id);
      await actor.deleteEmbeddedDocuments("Item", itemsToDelete);
      await topLevelItem.createEmbeddedDocuments("Item", itemsToImport, { keepId: true });
    }

  }
}

export async function addContainerItemsToActor(ddb, actor) {
  if (!game.modules.get("itemcollection")?.active || !game.settings.get("ddb-importer", "character-update-policy-use-item-containers")) return;

  const topLevelItems = actor.items
    .filter((item) =>
      hasProperty(item, "flags.ddbimporter.id")
      && hasProperty(item, "flags.ddbimporter.containerEntityId")
      && item.flags.ddbimporter.containerEntityId === ddb.character.id
      && hasProperty(item, "flags.itemcollection.contentsData")
      && item.flags.itemcollection.contentsData.length > 0
      && !item.flags.ddbimporter?.ignoreItemImport
    );

  for (const topLevelItem of topLevelItems) {
    const itemsToImport = duplicate(getProperty(topLevelItem.flags, "itemcollection.contentsData") ?? [])
      .map((item) => {
        if (hasProperty(item, "flags.ddbimporter.updateDocumentId")) {
          delete item.flags.ddbimporter.updateDocumentId;
        }
        return item;
      });
    const itemsToDelete = itemsToImport.map((item) => item._id);
    // const currency = duplicate(topLevelItem.system.currency);
    await topLevelItem.deleteEmbeddedDocuments("Item", itemsToDelete);
    await actor.createEmbeddedDocuments("Item", itemsToImport, { keepId: true });
  }
}
