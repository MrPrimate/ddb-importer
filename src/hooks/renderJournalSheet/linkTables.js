export function linkTables(html) {

  const content = $(html).find(`div[data-edit="content"]`);

  // Add a direct roll button into DDB-imported rolltables
  $(content)
    .find("a.entity-link[data-entity='RollTable']")
    .each((_, link) => {
      const data = $(link).data();
      const table = game.tables.get(data.id);
      if (table.data.flags.ddb.contentChunkId) {
        const button = $(
          `<a title="Click: Roll | Shift-Click: Self Roll" class="ddbimporter roll"><i class="fas fa-dice-d20"></i>  Roll!</a>`
        );

        $(link).after(button);
        $(button).on("click", async (event) => {
          event.preventDefault();
          const rollMode = event.shiftKey ? "selfroll" : "roll";

          // fix: Table description is undefined
          if (!table.data.description) table.data.description = table.data.name;

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
