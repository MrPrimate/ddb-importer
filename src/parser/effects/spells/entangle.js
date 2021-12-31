import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function entangleEffect(document) {
  let effectEntangleEntangle = baseSpellEffect(document, document.name);
  effectEntangleEntangle.changes.push(generateStatusEffectChange("Restrained"));
  document.effects.push(effectEntangleEntangle);

  return document;
}
