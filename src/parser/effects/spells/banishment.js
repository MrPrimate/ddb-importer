import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function banishmentEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = `
if(!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
//DAE Macro, Effect Value

const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.tokenUuid);

if (args[0] === "on") {
  await target.update({hidden : true}); // hide targeted token
  ChatMessage.create({content: target.name + "  was banished"});

}
if (args[0]=== "off") {
  await target.update({hidden : false}); // unhide token
  ChatMessage.create({content: target.name + "  returned"});
}

`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));
  document.effects.push(effect);

  return document;
}
