import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function holdPersonEffect(document) {
  let effectHoldPersonParalyzed = baseSpellEffect(document, document.name);
  effectHoldPersonParalyzed.changes.push(generateStatusEffectChange("Paralyzed"));
  document.effects.push(effectHoldPersonParalyzed);

  return document;
}
