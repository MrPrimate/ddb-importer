import { baseSpellEffect, generateATLChange, spellEffectModules } from "../specialSpells.js";

export function holyAuraEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "flags.midi-qol.advantage.ability.save.all",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
    {
      key: "flags.midi-qol.grants.disadvantage.attack.all",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "1",
      priority: "20",
    },
  );

  if (spellEffectModules().atlInstalled) {
    effect.changes.push(generateATLChange("ATL.dimLight", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '5'));
    effect.changes.push(generateATLChange("ATL.lightColor", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#ffffff'));
    effect.changes.push(generateATLChange("ATL.lightAlpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.25'));
    const lightAnimation = '{"type": "sunburst", "speed": 2,"intensity": 4}';
    effect.changes.push(generateATLChange("ATL.lightAnimation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, lightAnimation));
  }

  document.effects.push(effect);

  return document;
}
