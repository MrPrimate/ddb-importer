import { baseSpellEffect } from "../specialSpells.js";

export function viciousMockeryEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.disadvantage.attack.all",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    priority: 20,
  });
  setProperty(effect, "duration.turns", 2);
  setProperty(effect, "flags.dae.specialDuration", ["1Attack", "turnEnd"]);
  document.effects.push(effect);

  return document;
}
