import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function momentaryStasis(document) {
  let effect = baseSpellEffect(document, document.name);
  addStatusEffectChange(effect, "Incapacitated", 20, true);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isDamaged", "turnEndSource"]);
  document.effects.push(effect);

  return document;
}
