import { baseFeatEffect } from "../specialFeats.js";

export function fightingStyleInterceptionEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.DR.rwak",
      mode: 0,
      value: "1d10 + @data.attributes.prof",
      priority: "20",
    },
    {
      key: "flags.midi-qol.DR.mwak",
      mode: 2,
      value: "1d10 + @data.attributes.prof",
      priority: "20",
    },
    {
      key: "flags.midi-qol.DR.msak",
      mode: 2,
      value: "1d10 + @data.attributes.prof",
      priority: "20",
    },
    {
      key: "flags.midi-qol.DR.rsak",
      mode: 2,
      value: "1d10 + @data.attributes.prof",
      priority: "20",
    }
  );
  setProperty(effect, "duration.turns", 1);
  setProperty(effect, "flags.dae.specialDuration", ["isDamaged"]);
  document.data.target = {
    value: 1,
    width: null,
    units: "",
    type: "creature",
  };
  document.data.damage.parts = [];
  document.data.duration = {
    value: null,
    units: "inst",
  };
  document.effects.push(effect);
  return document;
}
