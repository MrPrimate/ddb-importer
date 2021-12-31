import { baseSpellEffect } from "../specialSpells.js";

export function mageArmorEffect(document) {
  let effectMageArmorMageArmor = baseSpellEffect(document, document.name);
  effectMageArmorMageArmor.changes.push({
    key: "data.attributes.ac.base",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    value: "13",
    priority: "5",
  });
  document.effects.push(effectMageArmorMageArmor);

  return document;
}
