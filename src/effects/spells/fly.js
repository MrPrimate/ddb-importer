import { baseSpellEffect } from "../specialSpells.js";

export function flyEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.movement.fly",
    value: "60",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });
  document.effects.push(effect);

  return document;
}
