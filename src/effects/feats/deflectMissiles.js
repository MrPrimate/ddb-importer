import { baseFeatEffect } from "../specialFeats.js";

export function deflectMissilesEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.DR.rwak",
    value: "1d10 + @mod + @classes.monk.levels",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 0,
  });
  effect.flags.dae.specialDuration = ["1Reaction"];

  setProperty(document, "data.activation.type", "reactiondamage");

  document.data["target"]["type"] = "self";
  document.data.range = { value: null, units: "self", long: null };

  // document.data.damage = { parts: [], versatile: "", value: "" };
  // document.data.duration = { value: 1, units: "min" };

  document.effects.push(effect);
  return document;
}
