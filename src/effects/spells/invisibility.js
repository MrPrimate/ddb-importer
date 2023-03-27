import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export async function invisibilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Convenient Effect: Invisible"));
  setProperty(effect, "flags.dae.specialDuration", ["1Attack", "1Spell"]);

  document.effects.push(effect);

  return document;
}
