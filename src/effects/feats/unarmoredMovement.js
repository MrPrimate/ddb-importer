import { effectModules } from "../effects.js";

export function unarmoredMovementEffect(document) {
  document.effects.forEach((effect) => {
    if (effect.name.includes("Passive") && effectModules().daeInstalled) {
      effect.changes = [
        {
          key: "system.attributes.movement.walk",
          value: `@scale.monk.unarmored-movement.value`,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ];
    }
  });
  return document;
}

