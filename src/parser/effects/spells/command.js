import { baseSpellEffect } from "../specialSpells.js";

export function commandEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  document.effects.push(effect);

  return document;
}
