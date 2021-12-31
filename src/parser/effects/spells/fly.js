import { baseSpellEffect } from "../specialSpells.js";

export function flyEffect(document) {
  let effectFlyFly = baseSpellEffect(document, document.name);
  effectFlyFly.changes.push({
    key: "data.attributes.movement.fly",
    value: "60",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });
  document.effects.push(effectFlyFly);

  return document;
}
