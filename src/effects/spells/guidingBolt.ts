import { baseSpellEffect } from "../specialSpells";

export function guidingBoltEffect(document) {
  const effect = baseSpellEffect(document, document.name);
  effect.system.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    value: "1",
    type: "override",
    priority: 20,
  });
  effect.flags.dae.specialDuration = ["isAttacked"];
  effect.duration = {
    value: 1,
    units: "rounds",
  };
  document.effects.push(effect);

  return document;
}
