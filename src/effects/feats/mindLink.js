import { baseFeatEffect } from "../specialFeats.js";

export function mindLinkEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    { key: "system.traits.languages.custom", value: "Telepathy", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 10 },
  );

  effect.duration.seconds = 3600;
  effect.duration.hour = 1;

  document.effects.push(effect);
  return document;
}

