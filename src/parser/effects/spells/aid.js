import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function aidEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.hp.max",
    value: "5 * (@spellLevel - 1)",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20,
  });
  // MACRO START
  const itemMacroText = `
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const target = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

let buf = (parseInt(args[1])-1) * 5;
let curHP = target.data.data.attributes.hp.value;
let curMax = target.data.data.attributes.hp.max;

if (args[0] === "on") {
  target.update({"data.attributes.hp.value": curHP+buf});
} else if (curHP > curMax) {
  target.update({"data.attributes.hp.value": curMax});
}
`;
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel", 0));
  document.effects.push(effect);

  return document;
}
