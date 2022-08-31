import { baseSpellEffect, generateTokenMagicFXChange, spellEffectModules } from "../specialSpells.js";

export function shieldEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.ac.bonus",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "+5",
    priority: "20",
  });
  effect.flags.dae.specialDuration = ["turnStart"];

  if (spellEffectModules().tokenMagicInstalled) {
    effect.changes.push(generateTokenMagicFXChange("water-field"));
  }

  document.effects.push(effect);

  return document;
}
