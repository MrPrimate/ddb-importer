import { baseSpellEffect } from "../specialSpells.js";

export function mageArmorEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.ac.calc",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "mage",
    priority: "5",
  });
  document.effects.push(effect);

  return document;
}
