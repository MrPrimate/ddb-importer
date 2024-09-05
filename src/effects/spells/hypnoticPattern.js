import { addStatusEffectChange, effectModules } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function hypnoticPatternEffect(document) {
  if (effectModules().midiQolInstalled) {
    let effectHypnoticPatternCharmed = baseSpellEffect(document, `${document.name} - Charmed`);
    addStatusEffectChange({ effect: effectHypnoticPatternCharmed, statusName: "Charmed" });
    document.effects.push(effectHypnoticPatternCharmed);

    let effectHypnoticPatternIncapacitated = baseSpellEffect(document, `${document.name} - Incapacitated`);
    addStatusEffectChange({ effect: effectHypnoticPatternIncapacitated, statusName: "Incapacitated" });
    document.effects.push(effectHypnoticPatternIncapacitated);
  } else {
    let effect = baseSpellEffect(document, document.name);
    addStatusEffectChange({ effect, statusName: "Charmed" });
    addStatusEffectChange({ effect, statusName: "Incapacitated" });
    document.effects.push(effect);
  }

  return document;
}
