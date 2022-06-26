import { baseItemEffect } from "../effects.js";

export function indomitableEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.optional.Indomitable.save.fail",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "reroll",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.Indomitable.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "ItemUses.Indomitable",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.Indomitable.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Use Indomitable to Succeed?",
      priority: "20",
    }
  );
  document.effects.push(effect);
  return document;
}
