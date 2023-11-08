import { baseItemEffect } from "../effects.js";

export function stoneOfGoodLuckEffect(document) {
  document.effects = [];

  const effect = baseItemEffect(document, document.name);

  effect.changes.push(
    {
      key: "system.bonuses.abilities.save",
      value: "+1",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 1,
    },
    {
      key: "system.bonuses.abilities.check",
      value: "+1",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority: 1,
    },
  );

  document.effects.push(effect);


  return document;
}
