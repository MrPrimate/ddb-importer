import { baseSpellEffect } from "../specialSpells.js";

export function protectionfromPoisonEffect(document) {
  let effectProtectionfromPoisonProtectionfromPoison = baseSpellEffect(document, document.name);
  effectProtectionfromPoisonProtectionfromPoison.changes.push({
    key: "data.traits.dr.value",
    value: "poison",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 0,
  });
  document.effects.push(effectProtectionfromPoisonProtectionfromPoison);

  return document;
}
