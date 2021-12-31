import { baseSpellEffect } from "../specialSpells.js";

export function stoneskinEffect(document) {
  let effectStoneskinStoneskin = baseSpellEffect(document, document.name);
  effectStoneskinStoneskin.changes.push({
    key: "data.traits.dr.value",
    value: "physical",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 0,
  });
  document.effects.push(effectStoneskinStoneskin);

  return document;
}
