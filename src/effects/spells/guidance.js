import { baseSpellEffect } from "../specialSpells.js";

export function guidanceEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'flags.midi-qol.optional.guidance.label',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: 'Guidance',
      priority: "20",
    },
    {
      key: 'flags.midi-qol.optional.guidance.check.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '+ 1d4',
      priority: "20",
    },
    {
      key: 'flags.midi-qol.optional.guidance.skill.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '+ 1d4',
      priority: "20",
    },
    {
      key: 'system.attributes.init.bonus',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '+ 1d4',
      priority: "20",
    },
  );
  foundry.utils.setProperty(effect, "flags.dae.specialDuration", [
    // "isSkill",
    // "isCheck",
    "isInitiative",
  ]);

  document.effects.push(effect);

  return document;
}
