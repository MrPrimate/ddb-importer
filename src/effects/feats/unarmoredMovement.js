export function unarmoredMovementEffect(document) {
  document.effects.forEach((effect) => {
    if (effect.name.includes("Constant")) {
      effect.changes = [
        {
          key: "system.attributes.movement.walk",
          value: "max(10+(ceil(((@classes.monk.levels)-5)/4))*5,10)",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ];
    }
  });
  return document;
}

