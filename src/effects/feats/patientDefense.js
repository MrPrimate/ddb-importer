import { addStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function patientDefenseEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  addStatusEffectChange(effect, "Dodge", 20, true);

  document.effects.push(effect);
  return document;
}
