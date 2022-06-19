export async function addContainerItemsToContainers(ddb, actor) {
  if (!game.modules.get("itemcollection")?.active) return;

  const topLevelItems = actor.items
    .filter((item) =>
      hasProperty(item.data, "flags.ddbimporter.id") &&
      hasProperty(item.data, "flags.ddbimporter.containerEntityId") &&
      item.data.flags.ddbimporter.containerEntityId === ddb.character.id
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
      console.warn({itemsToImport, itemsToDelete});
      await actor.deleteEmbeddedDocuments("Item", itemsToDelete);
      await topLevelItem.createEmbeddedDocuments("Item", itemsToImport, { keepId: true });
    }

  }

}
