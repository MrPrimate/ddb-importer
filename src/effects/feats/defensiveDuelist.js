import { baseFeatEffect } from "../specialFeats.js";

export function defensiveDuelistEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "data.attributes.ac.bonus",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "@data.attributes.prof",
      priority: "20",
    },
  );
  setProperty(effect, "duration.turns", 1);
  setProperty(effect, "flags.dae.specialDuration", ["isAttacked"]);
  setProperty(effect, "flags.dae.selfTarget", true);
  document.data.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.data.range = {
    value: null,
    long: null,
    units: "self",
  };
  document.data.duration = {
    value: null,
    units: "inst",
  };
  document.data.actionType = null;
  document.effects.push(effect);
  return document;
}
