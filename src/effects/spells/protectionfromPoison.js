import { baseSpellEffect } from "../specialSpells.js";

export function protectionfromPoisonEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.traits.dr.value",
    value: "poison",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 0,
  });
  document.effects.push(effect);

  return document;
}
