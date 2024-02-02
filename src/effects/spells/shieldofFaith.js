import { effectModules, generateTokenMagicFXChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function shieldofFaithEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.ac.bonus",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "+2",
    priority: "20",
  });

  if (effectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("bloom"));
  }

  document.effects.push(effect);

  return document;
}
