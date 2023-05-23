
import { baseItemEffect } from "../effects.js";

export function generateReversalOfFortuneEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.DR.all",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1",
      priority: "20",
    },
  );

  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  setProperty(effect, "flags.dae.specialDuration", ["1Reaction"]);
  setProperty(effect, "duration.turns", 1);
  setProperty(document, "system.activation.type", "reactiondamage");
  document.effects.push(effect);
  return document;
}
