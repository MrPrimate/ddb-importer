import { baseSpellEffect, generateTokenMagicFXChange, spellEffectModules } from "../specialSpells.js";

export function mirrorImageEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (spellEffectModules.tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("images"));
  }

  document.effects.push(effect);

  return document;
}
