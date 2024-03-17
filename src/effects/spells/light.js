import { effectModules, generateATLChange } from "../effects.js";
import { baseSpellEffect } from "../specialSpells.js";

export function lightEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (effectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '40'));
    effect.changes.push(generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '20'));
    effect.changes.push(generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'));
    effect.changes.push(generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'));
    const lightAnimation = '{"type": "pulse", "speed": 3,"intensity": 1}';
    effect.changes.push(generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, lightAnimation));
  }

  foundry.utils.setProperty(document, "flags.midiProperties.autoFailFriendly", true);
  document.effects.push(effect);

  return document;
}
