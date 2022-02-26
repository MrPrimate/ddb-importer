import { baseItemEffect } from "../effects.js";

export function uncannyDodgeEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    { key: "flags.midi-qol.uncanny-dodge", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 10 },
  );
  document.effects.push(effect);
  return document;
}

