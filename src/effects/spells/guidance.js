import { baseSpellEffect } from "../specialSpells.js";

export function guidanceEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'flags.midi-qol.optional.guidance.label.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: 'Guidance',
      priority: "20",
    },
    {
      key: 'flags.midi-qol.optional.guidance.check.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '+ 1d4',
      priority: "20",
    },
  );

  document.effects.push(effect);

  return document;
}
