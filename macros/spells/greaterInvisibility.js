if(!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")

const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.tokenUuid);

if (args[0] === "on") {
  await target.update({hidden : true}); // hide targeted token
  ChatMessage.create({content: target.name + " turns invisible", whisper: [game.user] });

}
if (args[0]=== "off") {
  await target.update({hidden : false}); // unhide token
  ChatMessage.create({content: target.name + " re-appears", whisper: [game.user] });
}
