import { baseFeatEffect } from "../specialFeats.js";

export function evasionEffect(document) {
  let effect = baseFeatEffect(document, `${document.name}`, true);

  effect.changes.push(
    {
      key: "flags.midi-qol.superSaver.dex",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    },
  );
  document.effects.push(effect);
  return document;
}
