import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function fearEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Frightened`);
  addStatusEffectChange(effect, "Frightened", 20, true);
  document.effects.push(effect);

  return document;
}
