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
  setProperty(effect, "duration.turns", 1);

  document.data["target"]["type"] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = null;
  document.data.duration = {
    value: 1,
    units: "turn",
  };
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
  moveEffect.flags.dae.specialDuration = ["turnStartSource"];
  setProperty(moveEffect, "duration.turns", 1);
  document.effects.push(moveEffect);

  return document;
}
