import { baseFeatEffect } from "../specialFeats.js";

export function steadyAimEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.advantage.attack.all",
      value: "1",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 30,
    },
  );
  effect.flags.dae.specialDuration = ["1Attack"];
  foundry.utils.setProperty(effect, "flags.dae.stackable", "noneName");
  foundry.utils.setProperty(effect, "duration.turns", 1);

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = null;
  // document.system.duration = {
  //   value: 1,
  //   units: "turn",
  // };
  document.effects.push(effect);

  let moveEffect = baseFeatEffect(document, `${document.name} Movement Restriction`);
  moveEffect.changes.push(
    {
      key: 'data.attributes.movement.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '0',
      priority: "40",
    },
  );
  moveEffect.duration = {
    startTime: null,
    seconds: 12,
    rounds: 2,
    turns: null,
    startRound: null,
    startTurn: null,
  };
  moveEffect.flags.dae.specialDuration = ["turnStartSource"];
  foundry.utils.setProperty(moveEffect, "flags.dae.stackable", "noneName");
  document.effects.push(moveEffect);

  return document;
}
