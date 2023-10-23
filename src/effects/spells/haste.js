import { baseSpellEffect } from "../specialSpells.js";

export function hasteEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+2", priority: "20" },
    {
      key: "flags.midi-qol.advantage.ability.save.dex",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1",
      priority: "20",
    },
    { key: "system.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "*2", priority: "30" }
  );
  effect.duration = {
    startTime: null,
    seconds: null,
    rounds: 10,
    startRound: null,
    startTurn: null,
  };
  document.effects.push(effect);

  return document;
}
