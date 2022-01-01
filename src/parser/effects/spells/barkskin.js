import { baseSpellEffect } from "../specialSpells.js";

export function barkskinEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "data.attributes.ac.value",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    value: "16",
    priority: "100",
  });
  document.effects.push(effect);

  return document;
}
