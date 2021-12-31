import { baseSpellEffect } from "../specialSpells.js";

export function rayofFrostEffect(document) {
  let effectRayofFrostRayofFrost = baseSpellEffect(document, document.name);
  effectRayofFrostRayofFrost.changes.push({
    key: "data.attributes.movement.walk",
    value: "-10",
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20,
  });
  document.effects.push(effectRayofFrostRayofFrost);

  return document;
}
