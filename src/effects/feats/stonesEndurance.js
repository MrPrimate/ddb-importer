
import { baseFeatEffect } from "../specialFeats.js";

export function stonesEnduranceEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push({
    key: "flags.midi-qol.DR.all",
    value: "[[1d12 + @abilities.con.mod]]",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20,
  });
  effect.flags.dae.specialDuration = ["1Reaction"];
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  foundry.utils.setProperty(document, "system.activation.type", "reactiondamage");

  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.damage.parts = [];
  document.system.ability = null;

  document.effects.push(effect);
  return document;
}
