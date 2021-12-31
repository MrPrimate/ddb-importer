import { baseSpellEffect } from "../specialSpells.js";

export function shieldofFaithEffect(document) {
  let effectShieldofFaithShieldofFaith = baseSpellEffect(document, document.name);
  effectShieldofFaithShieldofFaith.changes.push({
    key: "data.attributes.ac.bonus",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    value: "+2",
    priority: "20",
  });
  document.effects.push(effectShieldofFaithShieldofFaith);

  return document;
}
