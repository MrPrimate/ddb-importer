import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function greaseEffect(document) {
  let effectGreaseProne = baseSpellEffect(document, document.name);
  effectGreaseProne.changes.push(generateStatusEffectChange("Prone"));
  document.effects.push(effectGreaseProne);

  return document;
}
