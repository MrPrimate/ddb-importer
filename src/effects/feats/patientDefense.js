import { addStatusEffectChange } from "../effects.js";
import { baseFeatEffect } from "../specialFeats.js";

export function patientDefenseEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  addStatusEffectChange({ effect, statusName: "Dodge" });

  document.effects.push(effect);
  return document;
}
