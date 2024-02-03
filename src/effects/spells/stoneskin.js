import { baseSpellEffect } from "../specialSpells.js";

export function stoneskinEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.traits.dr.value",
      value: "bludgeoning",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
    {
      key: "system.traits.dr.value",
      value: "piercing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
    {
      key: "system.traits.dr.value",
      value: "slashing",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
    {
      key: "system.traits.dr.bypass",
      value: "mgc",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 0,
    },
  );
  document.effects.push(effect);

  return document;
}
