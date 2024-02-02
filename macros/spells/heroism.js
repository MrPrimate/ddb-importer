if (args[0] === "off") {
  const lastArg = args[args.length - 1];
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  await targetActor.update({ "system.attributes.hp.temp": 0 });
  await DAE.unsetFlag(targetActor, "heroismSpell");
  ChatMessage.create({ content: `Heroism ends on ${targetActor.name}, temp hitpoints set to 0` });
}
