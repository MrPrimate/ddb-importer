import { baseFeatEffect } from "../specialFeats.js";

export function fightingStyleInterceptionEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.DR.rwak",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1d10 + @system.attributes.prof",
      priority: "20",
    },
    {
      key: "flags.midi-qol.DR.mwak",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1d10 + @system.attributes.prof",
      priority: "20",
    },
    {
      key: "flags.midi-qol.DR.msak",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1d10 + @system.attributes.prof",
      priority: "20",
    },
    {
      key: "flags.midi-qol.DR.rsak",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "1d10 + @system.attributes.prof",
      priority: "20",
    }
  );
  foundry.utils.setProperty(effect, "duration.turns", 1);
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isDamaged"]);
  document.system.target = {
    value: 1,
    width: null,
    units: "",
    type: "creature",
  };
  document.system.damage.parts = [];
  document.system.duration = {
    value: null,
    units: "inst",
  };
  document.effects.push(effect);
  return document;
}
