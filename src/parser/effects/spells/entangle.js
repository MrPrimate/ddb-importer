import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function entangleEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Restrained"));
  document.effects.push(effect);

  return document;
}
