import { baseFeatEffect } from "../specialFeats.js";

export function formOfTheBeastReactionEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.attributes.ac.bonus",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "+ 1d8",
      priority: "20",
    },
  );
  foundry.utils.setProperty(effect, "duration.turns", 1);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isAttacked"]);
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.system.damage.parts = [];
  document.system.range = {
    value: null,
    long: null,
    units: "self",
  };
  document.system.duration = {
    value: null,
    units: "inst",
  };
  document.system.actionType = null;
  document.effects.push(effect);
  return document;
}
