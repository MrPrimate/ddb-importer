const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.tokenUuid);

if (args[0] === "on") {
  await target.update({ hidden: true }); // hide targeted token
  ChatMessage.create({ content: target.name + " was banished" });

}
if (args[0] === "off") {
  await target.update({ hidden: false }); // unhide token
  ChatMessage.create({ content: target.name + " returned" });
}
