import { baseSpellEffect } from "../specialSpells.js";

export function resilientSphereEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: 'system.attributes.movement.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '* 0.5',
      priority: "20",
    },
    {
      key: 'system.traits.di.all',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: '1',
      priority: "20",
    },
  );

  document.effects.push(effect);

  return document;
}
