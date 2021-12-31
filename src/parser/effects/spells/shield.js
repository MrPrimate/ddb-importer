import { baseSpellEffect } from "../specialSpells.js";

export function shieldEffect(document) {
  let effectShieldShield = baseSpellEffect(document, document.name);
  effectShieldShield.changes.push({
    key: "data.attributes.ac.bonus",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "+5",
    priority: "20",
  });
  document.effects.push(effectShieldShield);

  return document;
}
