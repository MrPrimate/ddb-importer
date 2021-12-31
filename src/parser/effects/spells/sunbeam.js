import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function sunbeamEffect(document) {
  let effectSunbeamBlinded = baseSpellEffect(document, document.name);
  effectSunbeamBlinded.changes.push(generateStatusEffectChange("Blinded"));
  document.effects.push(effectSunbeamBlinded);

  return document;
}
