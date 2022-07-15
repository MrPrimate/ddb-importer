import { baseSpellEffect } from "../specialSpells.js";

export function passWithoutTraceEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'system.skills.ste.bonuses.check',
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: '+ 10',
      priority: "20",
    }
  );

  document.effects.push(effect);

  return document;
}
