import { baseFeatEffect } from "../specialFeats.js";

export function vedalkenDispassionEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.advantage.ability.save.cha",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: 20,
    },
    {
      key: "flags.midi-qol.advantage.ability.save.wis",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: 20,
    },
    {
      key: "flags.midi-qol.advantage.ability.save.int",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: 20,
    }
  );
  document.effects.push(effect);
  return document;
}
