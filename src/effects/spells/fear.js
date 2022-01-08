import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function fearEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Frightened"));
  document.effects.push(effect);

  return document;
}
