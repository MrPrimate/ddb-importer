import { baseFeatEffect } from "../specialFeats.js";

export function steadyAimEffect(document) {
  let effect = baseFeatEffect(document, "1/2 Damage");
  effect.changes.push({
    key: "flags.midi-qol.advantage.attack.all",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 30,
  });
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
  return document;
}
