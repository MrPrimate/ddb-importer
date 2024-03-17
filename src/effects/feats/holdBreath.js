import { baseFeatEffect } from "../specialFeats.js";

export function holdBreathEffect(document) {
  const effect = baseFeatEffect(document, document.name);
  effect.duration.rounds = 600;
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.effects.push(effect);

  foundry.utils.setProperty(document, "flags.midiProperties.toggleEffect", true);
  document.system.activation = {
    "type": "special",
    "cost": 1,
    "condition": ""
  };

  if (document.name === "Partially Amphibious") {
    document.system.uses = { value: 1, max: "1", per: "lr", type: "" };
  }

  return document;
}
