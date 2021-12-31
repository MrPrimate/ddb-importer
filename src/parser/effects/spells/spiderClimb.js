import { baseSpellEffect } from "../specialSpells.js";

export function spiderClimbEffect(document) {
  let effectSpiderClimbSpiderClimb = baseSpellEffect(document, document.name);
  effectSpiderClimbSpiderClimb.changes.push({
    key: "data.attributes.movement.climb",
    value: "@attributes.movement.walk",
    mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
    priority: 20,
  });
  document.effects.push(effectSpiderClimbSpiderClimb);

  return document;
}
