
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

  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["1Reaction"]);
  foundry.utils.setProperty(effect, "duration.turns", 1);
  foundry.utils.setProperty(document, "system.activation.type", "reactiondamage");
  document.effects.push(effect);
  return document;
}
