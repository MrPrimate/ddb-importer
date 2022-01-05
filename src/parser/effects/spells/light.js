import { baseSpellEffect, generateATLChange, spellEffectModules } from "../specialSpells.js";

export function lightEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  if (spellEffectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.dimLight", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '40'));
    effect.changes.push(generateATLChange("ATL.brightLight", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '20'));
    effect.changes.push(generateATLChange("ATL.lightColor", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'));
    effect.changes.push(generateATLChange("ATL.lightAlpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'));
    const lightAnimation = '{"type": "pulse", "speed": 3,"intensity": 1}';
    effect.changes.push(generateATLChange("ATL.lightAnimation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, lightAnimation));
  }

  document.effects.push(effect);

  return document;
}
