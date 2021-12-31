import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function fearEffect(document) {
  let effectFearFear = baseSpellEffect(document, document.name);
  effectFearFear.changes.push(generateStatusEffectChange("Frightened"));
  document.effects.push(effectFearFear);

  return document;
}
