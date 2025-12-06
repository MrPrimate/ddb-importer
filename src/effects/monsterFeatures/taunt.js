
import { baseItemEffect, forceItemEffect } from "../effects.js";

export function generateTauntEffect(document) {
  let effect = baseItemEffect(document, document.name, {
    transfer: false,
  });
  effect.changes.push(
    {
      key: "flags.midi-qol.disadvantage.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "1",
      priority: "20",
    },
  );

  effect.duration.rounds = 2;
  effect.duration.seconds = 12;
  effect.flags.dae.showIcon = true;
  effect.flags.dae.specialDuration = ["turnStart", "combatEnd"];

  document.effects.push(effect);
  document = forceItemEffect(document);
  return document;
}
