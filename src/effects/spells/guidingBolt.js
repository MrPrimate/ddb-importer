import { baseSpellEffect } from "../specialSpells.js";

export function guidingBoltEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.grants.advantage.attack.all",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    priority: 20,
  });
  effect.flags.dae.specialDuration = ["isAttacked"];
  effect.duration = {
    startTime: null,
    seconds: null,
    rounds: 1,
    turns: null,
    startRound: null,
    startTurn: null,
  };
  document.effects.push(effect);

  return document;
}
