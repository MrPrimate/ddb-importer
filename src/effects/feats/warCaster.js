import { baseItemEffect, forceManualReaction } from "../effects.js";

export function warCasterEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    { key: "flags.midi-qol.advantage.concentration", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 10 },
  );
  document = forceManualReaction(document);
  document.effects.push(effect);
  return document;
}

