actor = game.actors.getName("ACTOR NAME HERE");

items = actor.items
  .filter((i) =>
    !["spell", "feat", "background", "race", "class", "subclass"].includes(i.type)
    && hasProperty(i, "flags.ddbimporter.id")
    && !getProperty(i, "flags.ddbimporter.action")
  ).map((i) => {
    return {
      _id: i.id,
      name: i.name,
      "flags.ddbimporter.containerEntityTypeId": "1581111423",
    };
  });

await actor.updateEmbeddedDocuments("Item", items);
