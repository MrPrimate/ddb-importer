import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export async function invisibilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("invisible"));

  document.effects.push(effect);

  return document;
}
