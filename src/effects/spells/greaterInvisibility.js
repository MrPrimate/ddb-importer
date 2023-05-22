import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export async function greaterInvisibilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Convenient Effect: Invisible"));
  document.effects.push(effect);

  return document;
}
