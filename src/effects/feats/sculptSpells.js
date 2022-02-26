import { baseItemEffect } from "../effects.js";

export function sculptSpellsEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    { key: "flags.midi-qol.sculptSpell", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 10 },
  );
  document.effects.push(effect);
  return document;
}

