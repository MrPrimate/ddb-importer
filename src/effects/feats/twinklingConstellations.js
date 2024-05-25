import { baseFeatEffect } from "../specialFeats.js";

export function twinklingConstellationsEffect(document) {
  foundry.utils.setProperty(document, "system.target.type", "self");
  foundry.utils.setProperty(document, "system.range.units", "self");
  foundry.utils.setProperty(document, "system.range.value", "");
  foundry.utils.setProperty(document, "system.actionType", null);

  let effect = baseFeatEffect(document, document.name);
  foundry.utils.setProperty(effect, "duration.seconds", 600);

  effect.changes.push(
    {
      key: "system.attributes.movement.fly",
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      value: "20",
      priority: "20",
    },
    {
      key: "system.attributes.movement.hover",
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: "true",
      priority: "20",
    },
  );

  document.effects.push(effect);

  return document;
}
