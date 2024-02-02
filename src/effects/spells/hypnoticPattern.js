import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function hypnoticPatternEffect(document) {
  let effectHypnoticPatternCharmed = baseSpellEffect(document, document.name);
  addStatusEffectChange(effectHypnoticPatternCharmed, "Charmed", 20, true);
  document.effects.push(effectHypnoticPatternCharmed);

  let effectHypnoticPatternIncapacitated = baseSpellEffect(document, document.name);
  addStatusEffectChange(effectHypnoticPatternIncapacitated, "Incapacitated", 20, true);
  document.effects.push(effectHypnoticPatternIncapacitated);

  return document;
}
