import { baseItemEffect } from "../effects.js";

export function alertEffect(document) {
  let effect = baseItemEffect(document, document.name);

  effect.changes.push({
    key: "flags.dnd5e.initiativeAlert",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: "0",
  });

  document.effects = [
    effect,
  ];
  return document;
}
