import { baseSpellEffect, generateMacroChange, generateMacroFlags, generateATLChange, spellEffectModules } from "../specialSpells.js";

export function darkvisionEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.senses.darkvision",
    value: "60",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });

  if (spellEffectModules.atlInstalled) {
    effect.changes.push(generateATLChange("ATL.dimSight", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '60', 5));
  } else {
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
    effect.changes.push(generateMacroChange(""));
  }

  document.effects.push(effect);

  return document;
}
