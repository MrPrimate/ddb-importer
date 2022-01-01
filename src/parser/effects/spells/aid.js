import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function aidEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.hp.max",
    value: "5 * (@spellLevel - 1)",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20,
  });
  const itemMacroText = `
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId)

let buf = (parseInt(args[1])-1) * 5;
let curHP = tactor.data.data.attributes.hp.value;
let curMax = tactor.data.data.attributes.hp.max;

if (args[0] === "on") {
  tactor.update({"data.attributes.hp.value": curHP+buf})
} else if (curHP > curMax) {
  tactor.update({"data.attributes.hp.value": curMax})
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel @data.attributes.hp.max", 0));
  document.effects.push(effect);

  return document;
}
