import { addStatusEffectChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export async function invisibilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  addStatusEffectChange(effect, "Invisible", 20, true);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Attack", "1Spell"]);

  document.effects.push(effect);

  return document;
}
