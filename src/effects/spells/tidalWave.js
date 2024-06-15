import { baseSpellEffect } from "../specialSpells.js";
import { addStatusEffectChange } from "../effects.js";

export function tidalWaveEffect(document) {

  let effect = baseSpellEffect(document, `${document.name} - Prone`);
  addStatusEffectChange(effect, "Prone", 20, true);
  effect.duration = {
    seconds: 99999,
    rounds: 999,
  };
  document.effects.push(effect);

  return document;

}
