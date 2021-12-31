import { baseSpellEffect } from "../specialSpells.js";

export function commandEffect(document) {
  let effectCommandCommand = baseSpellEffect(document, document.name);
  document.effects.push(effectCommandCommand);

  return document;
}
