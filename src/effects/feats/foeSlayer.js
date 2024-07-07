import { baseFeatEffect } from "../specialFeats.js";

export function foeSlayerEffect(document) {
  let effect = baseFeatEffect(document, document.name, { transfer: true });
  effect.changes.push(
    {
      key: "flags.midi-qol.optional.foeSlayer.damage.msak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "@abilities.wis.mod",
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.foeSlayer.damage.mwak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "@abilities.wis.mod",
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.foeSlayer.damage.rsak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "@abilities.wis.mod",
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.foeSlayer.damage.rwak",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "@abilities.wis.mod",
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.foeSlayer.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: document.name,
      priority: 20,
    },
    {
      key: "flags.midi-qol.optional.foeSlayer.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "each-round",
      priority: 20,
    },
  );
  document.effects.push(effect);
  return document;
}
