
import { baseItemEffect } from "../effects.js";

export function generatePackTacticsEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.advantage.attack.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "findNearby(-1, targetUuid, 5, 0).length > 1",
      priority: "20",
    },
  );

  document.effects.push(effect);
  return document;
}
