import { baseSpellEffect } from "../specialSpells.js";

export function comprehendLanguagesEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'system.traits.languages.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '1',
      priority: "20",
    }
  );

  document.effects.push(effect);

  return document;
}
