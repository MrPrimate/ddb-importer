import { baseSpellEffect } from "../specialSpells.js";

export function stoneskinEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.traits.dr.custom",
    value: "Non-Magical Physical",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 0,
  });
  document.effects.push(effect);

  return document;
}
