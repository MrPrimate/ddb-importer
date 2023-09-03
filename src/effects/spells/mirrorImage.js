import { effectModules } from "../effects.js";
import { baseSpellEffect, generateTokenMagicFXChange } from "../specialSpells.js";

export function mirrorImageEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (effectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("images"));
  }

  document.effects.push(effect);

  return document;
}
