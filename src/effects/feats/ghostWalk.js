import { baseFeatEffect } from "../specialFeats.js";

export function ghostWalkEffect(document) {

  let effect = baseFeatEffect(document, `${document.name} (Fight)`);

  effect.changes.push(
    {
      key: "system.attributes.movement.fly",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "10",
      priority: "5",
    },
    {
      key: "system.attributes.movement.hover",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "true",
      priority: "5",
    },
  );

  foundry.utils.setProperty(effect, "duration.seconds", 600);

  document.effects.push(effect);
  return document;
}
