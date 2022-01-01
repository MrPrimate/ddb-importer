import { baseSpellEffect } from "../specialSpells.js";

export function mageArmorEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.ac.base",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "13",
    priority: "5",
  });
  document.effects.push(effect);

  return document;
}
