import { baseSpellEffect } from "../specialSpells.js";

export function barkskinEffect(document) {
  let effectBarkskinBarkskin = baseSpellEffect(document, document.name);
  effectBarkskinBarkskin.changes.push({
    key: "data.attributes.ac.value",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    value: "16",
    priority: "100",
  });
  document.effects.push(effectBarkskinBarkskin);

  return document;
}
