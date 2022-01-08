import { baseSpellEffect } from "../specialSpells.js";

export function stoneskinEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.traits.dr.value",
    value: "physical",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 0,
  });
  document.effects.push(effect);

  return document;
}
