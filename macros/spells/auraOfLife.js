if (!game.combat) return;
const lastArg = args[args.length - 1];

if (args[0] === "each") {
  const targetActor = lastArg.actor;
  if (targetActor.system.attributes.hp.value === 0) {
    await targetActor.update({ "system.attributes.hp.value": 1 });
    ui.notifications.info(`${targetActor.name} has been revived to 1 HP.`);
    ChatMessage.create({ content: `${targetActor.name} has been revived to 1 HP by Aura of Life.` });
  }
}
