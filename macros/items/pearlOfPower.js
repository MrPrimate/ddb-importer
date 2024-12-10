async function regainSlot(actor, level) {
  const currentSpellValue = actor.system.spells[`spell${level}`].value;
  if (currentSpellValue + 1 > actor.system.spells[`spell${level}`].max) {
    ui.notifications.warn(`You already have the maximum spells available for level ${level}`);
  } else {
    await actor.update({ [`system.spells.spell${level}.value`]: currentSpellValue + 1 });
    await ChatMessage.create({
      content: `${actor.name} has recovered one spell slot of <b><u>Level ${level}</u>.`,
    });
  }
}

async function generateDialog(actor) {
  const buttons = {};

  for (let i = 1; i <= 3; i++) {
    const currentSpellValue = actor.system.spells[`spell${i}`].value;
    const maxSpellValue = actor.system.spells[`spell${i}`].max;
    if (currentSpellValue < maxSpellValue) buttons[`spell${i}`] = {
      label: `Level ${i}`,
      callback: () => regainSlot(actor, i),
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
      - ${actor.system.spells.spell1.max - actor.system.spells.spell1.value} first level spells
      <br>
      - ${actor.system.spells.spell2.max - actor.system.spells.spell2.value} second level spells
      <br>
      - ${actor.system.spells.spell3.max - actor.system.spells.spell3.value} third level spells
      <br>
      <br>
      Please select below which slot to recover:
      <br>
      <br>
      `,
    buttons,
  }).render(true);
}


if (scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction")) {
  if (!actor) {
    logger.error("No actor passed to macro");
    return;
  }
  generateDialog(actor);
} else if (args[0] === "on") {

  const lastArg = args[args.length - 1];
  const tActor = await fromUuid(lastArg.actorUuid);
  generateDialog(tActor);
}

