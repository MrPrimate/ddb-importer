import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function rayofSicknessEffect(document) {
  let effect = baseSpellEffect(document, `${document.name} - Poisoned`);
  addStatusEffectChange(effect, "Poisoned", 20, true);
  effect.flags.dae.specialDuration = ["turnEndSource"];
  document.effects.push(effect);

  return document;
}
