import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function sunbeamEffect(document) {
  let effectSunbeamBlinded = baseSpellEffect(document, `${document.name} - Blinded`);
  addStatusEffectChange({ effect: effectSunbeamBlinded, statusName: "Blinded" });
  document.effects.push(effectSunbeamBlinded);

  return document;
}
