import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function dominateBeastEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Charmed`);
  addStatusEffectChange(effect, "Charmed", 20, true);
  document.effects.push(effect);

  return document;
}
