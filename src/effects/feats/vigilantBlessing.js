import { baseFeatEffect } from "../specialFeats.js";

export function vigilantBlessingEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push({
    key: "flags.dnd5e.initiativeAdv",
    value: "1",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 30,
  });
  effect.flags.dae.specialDuration = ["Initiative"];
  document.data["target"]["type"] = "creature";
  document.data.actionType = null;
  document.effects.push(effect);
  return document;
}
