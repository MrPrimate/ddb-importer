import { baseSpellEffect } from "../specialSpells.js";

export function resistanceEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'flags.midi-qol.optional.resistance.label',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: 'Resistance',
      priority: "20",
    },
    {
      key: 'flags.midi-qol.optional.resistance.save.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '+ 1d4',
      priority: "20",
    },
  );
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isSave"]);

  document.effects.push(effect);

  return document;
}
