import { baseItemEffect } from "../effects.js";

export function powerfulBuild (document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    { key: "flags.dnd5e.powerfulBuild", value: "1", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 1 },
  );
  document.effects.push(effect);
  return document;
}
