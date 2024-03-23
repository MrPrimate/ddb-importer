import { baseItemEffect, forceManualReaction, effectModules } from "../effects.js";

export function warCasterEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.attributes.concentration.roll.mode",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      priority: 10
    },
  );
  if (effectModules().midiQolInstalled) {
    document = forceManualReaction(document);
  }
  document.effects.push(effect);
  return document;
}

