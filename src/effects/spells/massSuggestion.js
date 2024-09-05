import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function massSuggestionEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Charmed`);
  addStatusEffectChange({ effect, statusName: "Charmed" });
  document.effects.push(effect);

  return document;
}
