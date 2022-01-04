import { baseSpellEffect, generateTokenMagicFXChange, spellEffectModules } from "../specialSpells.js";

export function shieldofFaithEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.ac.bonus",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "+2",
    priority: "20",
  });

  if (spellEffectModules.tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("bloom"));
  }

  document.effects.push(effect);

  return document;
}
