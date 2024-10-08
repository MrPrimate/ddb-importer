import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function momentaryStasis(document) {
  let effect = baseSpellEffect(document, document.name);
  addStatusEffectChange({ effect, statusName: "Incapacitated" });
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isDamaged", "turnEndSource"]);
  document.effects.push(effect);

  return document;
}
