import { baseSpellEffect } from "../specialSpells.js";

export function spiderClimbEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push({
    key: "system.attributes.movement.climb",
    value: "@attributes.movement.walk",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });
  document.effects.push(effect);

  return document;
}
