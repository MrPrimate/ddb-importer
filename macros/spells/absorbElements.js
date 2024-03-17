const itemName = args[0].itemData.name;
const targetActor = args[0].tokenUuid
  ? (await fromUuid(args[0].tokenUuid)).actor
  : game.actors.get(args[0].actorId);

async function updateEffects(html) {
  const element = html.find("#element").val();
  const effect = targetActor.effects.find((i) => (i.name ?? i.label) === `${itemName} - Extra Damage`);
  const changes = foundry.utils.duplicate(effect.changes);
  changes[0].value += `[${element}]`;
  changes[1].value += `[${element}]`;
  await effect.update({ changes });
  const resistanceEffect = targetActor.effects.find((i) => (i.name ?? i.label) === `${itemName} - Resistance`);
  const resistanceChanges = foundry.utils.duplicate(resistanceEffect.changes);
  resistanceChanges[0].value = element;
  await resistanceEffect.update({ changes: resistanceChanges });
}

await new Promise(resolve => {
  let isButtonClose = false;
  new Dialog({
    title: "Choose a damage type",
    content: `
      <form class="flexcol">
        <div class="form-group">
          <select id="element">
            <option value="acid">Acid</option>
            <option value="cold">Cold</option>
            <option value="fire">Fire</option>
            <option value="lightning">Lightning</option>
            <option value="thunder">Thunder</option>
          </select>
        </div>
      </form>
    `,
    // select element type
    buttons: {
      yes: {
        icon: '<i class="fas fa-bolt"></i>',
        label: "Select",
        callback: async(html) => {
          isButtonClose = true;
          try {
            await updateEffects(html);
          } finally {
            resolve();
          }
        },
      },
    },
    close: () => {
      // Avoid racing the button callback if closed via button
      if (!isButtonClose) resolve();
    },
  }).render(true);
});
