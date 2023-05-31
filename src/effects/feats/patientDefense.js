import { generateStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function patientDefenseEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Dodge", 20, true));

  document.effects.push(effect);
  return document;
}
