import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function hypnoticPatternEffect(document) {
  let effectHypnoticPatternCharmed = baseSpellEffect(document, document.name);
  effectHypnoticPatternCharmed.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectHypnoticPatternCharmed);

  return document;
}
