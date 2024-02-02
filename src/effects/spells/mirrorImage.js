import { effectModules, generateTokenMagicFXChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function mirrorImageEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (effectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("images"));
  }

  document.effects.push(effect);

  return document;
}
