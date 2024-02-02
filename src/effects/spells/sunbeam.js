import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function sunbeamEffect(document) {
  let effectSunbeamBlinded = baseSpellEffect(document, document.name);
  addStatusEffectChange(effectSunbeamBlinded, "Blinded", 20, true);
  document.effects.push(effectSunbeamBlinded);

  return document;
}
