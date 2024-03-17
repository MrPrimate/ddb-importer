import { baseFeatEffect } from "../specialFeats.js";

export function deflectMissilesEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.DR.rwak",
    value: "[[1d10 + @mod + @classes.monk.levels]]",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    priority: 0,
  });
  effect.flags.dae.specialDuration = ["1Reaction"];
  // foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  // foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  foundry.utils.setProperty(document, "system.activation.type", "reactiondamage");
  // document.system.actionType = null;

  document.system.damage.parts = [];
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };

  document.effects.push(effect);
  return document;
}
