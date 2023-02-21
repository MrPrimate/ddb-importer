const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const targetToken = await fromUuid(lastArg.tokenUuid);

const dimVision = targetToken.data.dimSight;
if (args[0] === "on") {
  DAE.setFlag(targetActor, 'darkvisionSpell', dimVision);
  const newSight = dimVision < 60 ? 60 : dimVision;
  await targetToken.update({ "dimSight": newSight });
  await targetActor.update({ "token.dimSight": newSight });
  ChatMessage.create({ content: `${targetToken.name}'s vision has been improved` });
}
if (args[0] === "off") {
  const sight = DAE.getFlag(targetActor, 'darkvisionSpell');
  targetToken.update({ "dimSight": sight });
  await targetActor.update({ "token.dimSight": sight });
  DAE.unsetFlag(targetActor, 'darkvisionSpell');
  ChatMessage.create({ content: `${targetToken.name}'s vision has been returned` });
}
