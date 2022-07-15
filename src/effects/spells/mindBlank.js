import { baseSpellEffect } from "../specialSpells.js";

export function mindBlankEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'system.traits.di.value',
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: 'psychic',
      priority: "20",
    }
  );

  document.effects.push(effect);

  return document;
}
