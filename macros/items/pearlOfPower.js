if (args[0] !== "on") return;

const lastArg = args[args.length - 1];
const tActor = await fromUuid(lastArg.actorUuid);

async function regainSlot(level) {
  const currentSpellValue = tActor.system.spells[`spell${level}`].value;
  if (currentSpellValue + 1 > tActor.system.spells[`spell${level}`].max) {
    ui.notifications.warn(`You already have the maximum spells available for level ${level}`);
  } else {
    await tActor.update({ [`system.spells.spell${level}.value`]: currentSpellValue + 1 });
    await ChatMessage.create({
      content: `${tActor.name} has recovered one spell slot of <b><u>Level ${level}</u>.`,
    });
  }
}

const buttons = {};

for (let i = 1; i <= 3; i++) {
  const currentSpellValue = tActor.system.spells[`spell${i}`].value;
  const maxSpellValue = tActor.system.spells[`spell${i}`].max;
  if (currentSpellValue < maxSpellValue) buttons[`spell${i}`] = {
    label: `Level ${i}`,
    callback: () => regainSlot(i),
  };
}

if (!Object.keys(buttons).length) {
  ui.notifications.warn("You have no appropriate spell slots to recover");
  return;
}

new Dialog({
  content: `
    <br>
    You can regain a single spent spell slot, you have used:
    <br>
    <br>
    - ${tActor.system.spells.spell1.max - tActor.system.spells.spell1.value} first level spells
    <br>
    - ${tActor.system.spells.spell2.max - tActor.system.spells.spell2.value} second level spells
    <br>
    - ${tActor.system.spells.spell3.max - tActor.system.spells.spell3.value} third level spells
    <br>
    <br>
    Please select below which slot to recover:
    <br>
    <br>
     `,
  buttons,
}).render(true);
