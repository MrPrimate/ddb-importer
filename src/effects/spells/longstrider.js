import { baseSpellEffect } from "../specialSpells.js";

export function longstriderEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    { key: "system.attributes.movement.walk", value: "10", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
    { key: "system.attributes.movement.fly", value: "10", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
    { key: "system.attributes.movement.burrow", value: "10", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
    { key: "system.attributes.movement.climb", value: "10", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 },
    { key: "system.attributes.movement.swim", value: "10", mode: CONST.ACTIVE_EFFECT_MODES.ADD, priority: 20 }
  );
  document.effects.push(effect);

  return document;
}
