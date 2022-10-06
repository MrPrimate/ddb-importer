import { baseFeatEffect, featEffectModules } from "../specialFeats.js";
import { generateATLChange } from "../effects.js";

export function giantsMightEffect(document) {
  let effect = baseFeatEffect(document, document.name);

  if (featEffectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5));
    effect.changes.push(generateATLChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5));
  }

  effect.changes.push({
    key: "flags.midi-qol.advantage.ability.save.str",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "5",
  },
  {
    key: "flags.midi-qol.advantage.ability.check.str",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "1",
    priority: "5",
  },
  {
    key: "flags.midi-qol.optional.giantsmight.label",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "Giant's Might Bonus Damage",
    priority: "5",
  },
  {
    key: "flags.midi-qol.optional.giantsmight.count",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: "each-round",
    priority: "5",
  },
  {
    key: "flags.midi-qol.optional.giantsmight.damage.all",
    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
    value: `${document.system.damage.parts[0][0]}`,
    priority: "5",
  });

  document.system.damage.parts = [];

  document.effects.push(effect);
  return document;
}
