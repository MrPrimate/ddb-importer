
import { baseItemEffect, forceItemEffect } from "../effects";

export function generateTauntEffect(document) {
  const effect = baseItemEffect(document, document.name, {
    transfer: false,
  });
  effect.system.changes.push(
    {
      key: "flags.midi-qol.disadvantage.all",
      type: "custom",
      value: "1",
      priority: "20",
    },
  );

  effect.duration.value = 2;
  effect.duration.units = "rounds";
  effect.showIcon = 2;
  effect.flags.dae.specialDuration = ["turnStart", "combatEnd"];

  document.effects.push(effect);
  document = forceItemEffect(document);
  return document;
}
