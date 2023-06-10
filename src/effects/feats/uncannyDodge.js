import { baseFeatEffect } from "../specialFeats.js";

export function uncannyDodgeEffect(document) {
  let effect = baseFeatEffect(document, `${document.name} - 1/2 Damage`);
  effect.changes.push({
    key: "flags.midi-qol.uncanny-dodge",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 10,
  });
  effect.flags.dae.specialDuration = ["1Reaction"];
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = null;
  document.system.activation.type = "reactiondamage";
  document.effects.push(effect);
  return document;
}
