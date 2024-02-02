import { baseFeatEffect } from "../specialFeats.js";
import { addStatusEffectChange } from "../effects.js";

export function kiEmptyBodyEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    { key: "system.traits.dr.all", value: "", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
    { key: "system.traits.dv.value", value: "force", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 0 },
  );

  addStatusEffectChange(effect, "invisible");

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.duration = { value: 1, units: "min" };
  document.system.actionType = null;

  document.effects.push(effect);
  return document;
}
