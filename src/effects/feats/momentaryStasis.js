import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function momentaryStasis(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Incapacitated"));
  setProperty(effect, "flags.dae.specialDuration", ["isDamaged", "turnEndSource"]);
  document.effects.push(effect);

  return document;
}
