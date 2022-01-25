import { baseItemEffect } from "../effects.js";

export function potentCantripEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    { key: "flags.midi-qol.potentCantrip", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20 },
  );
  document.effects.push(effect);
  return document;
}

