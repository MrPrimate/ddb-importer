import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function greaseEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Prone"));
  document.effects.push(effect);

  return document;
}
