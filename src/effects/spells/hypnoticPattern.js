import { addStatusEffectChange, effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function hypnoticPatternEffect(document) {
  if (effectModules().midiQolInstalled) {
    let effectHypnoticPatternCharmed = baseSpellEffect(document, `${document.name} - Charmed`);
    addStatusEffectChange(effectHypnoticPatternCharmed, "Charmed", 20, true);
    document.effects.push(effectHypnoticPatternCharmed);

    let effectHypnoticPatternIncapacitated = baseSpellEffect(document, `${document.name} - Incapacitated`);
    addStatusEffectChange(effectHypnoticPatternIncapacitated, "Incapacitated", 20, true);
    document.effects.push(effectHypnoticPatternIncapacitated);
  } else {
    let effect = baseSpellEffect(document, document.name);
    addStatusEffectChange(effect, "Charmed", 20, true);
    addStatusEffectChange(effect, "Incapacitated", 20, true);
    document.effects.push(effect);
  }

  return document;
}
