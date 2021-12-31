import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function banishmentEffect(document) {
  let effectBanishmentBanishment = baseSpellEffect(document, document.name);
  const itemMacroText = `
if(!game.modules.get("advanced-macros")?.active) ui.notifications.error("Please enable the Advanced Macros module")
//DAE Macro, Effect Value = @target

let target = canvas.tokens.get(args[1]); //find target

if (args[0] === "on") {
    target.update({hidden : true}); // hide targeted token
    ChatMessage.create({content: target.name + "  was banished"});
    
}
if(args[0]=== "off") {
 target.update({hidden : false}); // unhide token
 ChatMessage.create({content: target.name + "  returned"});
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectBanishmentBanishment.changes.push(generateMacroChange("", 0));
  document.effects.push(effectBanishmentBanishment);

  return document;
}
