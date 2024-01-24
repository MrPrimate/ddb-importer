import { baseFeatEffect } from "../specialFeats.js";
import { generateATLChange, effectModules } from "../effects.js";

export function giantStatureEffect(document) {
  let effect = baseFeatEffect(document, document.name);

  if (effectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5));
    effect.changes.push(generateATLChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5));
  }

  effect.changes.push(
    {
      key: "system.traits.size",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "lg",
      priority: 25,
    },
  );

  document.system.damage.parts = [];

  document.system.target = {
    value: null,
    width: null,
    units: "",
    type: "self",
  };
  document.system.range = {
    value: null,
    long: null,
    units: "self",
  };

  document.effects.push(effect);
  return document;
}
