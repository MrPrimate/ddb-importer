import { baseFeatEffect } from "../specialFeats.js";

export function holdBreathEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  effect.duration.rounds = 600;
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.effects.push(effect);

  setProperty(document, "flags.midiProperties.toggleEffect", true);

  return document;
}
