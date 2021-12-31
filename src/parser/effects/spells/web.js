import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function webEffect(document) {
  let effectWebRestrained = baseSpellEffect(document, document.name);
  effectWebRestrained.changes.push(generateStatusEffectChange("Restrained"));
  document.effects.push(effectWebRestrained);

  return document;
}
