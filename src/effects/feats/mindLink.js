import { baseItemEffect } from "../effects.js";

export function mindLinkEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    { key: "system.traits.languages.custom", value: "Telepathy", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 10 },
  );

  effect.duration.seconds = 3600;
  effect.duration.hour = 1;
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}

