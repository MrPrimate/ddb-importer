const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
  ChatMessage.create({ content: `${target.name} is levitated 20ft` });
  targetActor.update({ elevation: 20 });
}
if (args[0] === "off") {
  targetActor.update({ elevation: 0 });
  ChatMessage.create({ content: `${target.name} is returned to the ground` });
}
