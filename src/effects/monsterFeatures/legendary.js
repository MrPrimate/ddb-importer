import { baseItemEffect } from "../effects.js";

export function generateLegendaryEffect(document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.optional.LegRes.save.fail.all",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "success",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.LegRes.count",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "@resources.legres.value",
      priority: "20",
    },
    {
      key: "flags.midi-qol.optional.LegRes.label",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: "Use Legendary Resistance to Succeed?",
      priority: "20",
    }
  );

  document.effects.push(effect);
  return document;
}
