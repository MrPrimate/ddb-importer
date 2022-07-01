export function linkTables(type, html) {

  // if journal
  let content;
  let findString;
  switch (type) {
    case "journal":
      content = $(html).find(`div[data-edit="content"]`);
      findString = "a.content-link[data-entity='RollTable']";
      break;
    case "item": {
      const tableCompendium = game.settings.get("ddb-importer", "entity-table-compendium");
      content = $(html).find(`div[data-edit="data.description.value"]`);
      findString = `a.content-link[data-pack='${tableCompendium}']`;
      break;
    }
    // no default
  }


  // Add a direct roll button into DDB-imported rolltables
  $(content)
    .find(findString)
    .each(async (_, link) => {
      const data = $(link).data();
      const pack = game.packs.get(data.pack);

      const table = pack
        ? await pack.getDocument(data.id)
        : game.tables.get(data.id);

      if (table?.flags?.ddb?.contentChunkId || pack) {
        const button = $(
          `<a title="Click: Roll | Shift-Click: Self Roll" class="ddbimporter roll"><i class="fas fa-dice-d20"></i>  Roll!</a>`
        );

        $(link).after(button);
        $(button).on("click", async (event) => {
          event.preventDefault();
          const rollMode = event.shiftKey ? "selfroll" : "roll";

          // fix: Table description is undefined
          if (!table.description) table.description = table.name;

          const draw = await table.roll();

          draw.results = draw.results.map((result) => {
            if (!result.img)
              result.img = "icons/svg/d20-highlight.svg";
            return result;
          });

          await table.toMessage(draw.results, {
            roll: draw.roll,
            messageOptions: {
              speaker: game.user.name,
              rollMode: rollMode,
            },
          });

        });
      }
    });
}
