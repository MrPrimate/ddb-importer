import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function darkvisionEffect(document) {
  let effectDarkvisionDarkvision = baseSpellEffect(document, document.name);
  effectDarkvisionDarkvision.changes.push({
    key: "data.attributes.senses.darkvision",
    value: "60",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });
  const itemMacroText = `
//DAE Macro Execute, Effect Value = "Macro Name" @target
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId)

let dimVision = target.data.dimSight;
if (args[0] === "on") {
    DAE.setFlag(tactor, 'darkvisionSpell', dimVision);
    let newSight = dimVision < 60 ? 60 : dimVision
    await target.update({"dimSight" : newSight});
    await tactor.update({"token.dimSight" : newSight})
    ChatMessage.create({content: \`\${target.name}'s vision has been improved\`});
}
if(args[0] === "off") {
    let sight = DAE.getFlag(tactor, 'darkvisionSpell');
    target.update({"dimSight" : sight });
    await tactor.update({"token.dimSight" : sight})
    DAE.unsetFlag(tactor, 'darkvisionSpell');
    ChatMessage.create({content: \`\${target.name}'s vision has been returned\`});
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectDarkvisionDarkvision.changes.push(generateMacroChange(""));
  document.effects.push(effectDarkvisionDarkvision);

  return document;
}
