
import { baseItemEffect } from "../effects.js";

export function generateSuaveDefenseEffect(ddbMonster, document) {
  let effect = baseItemEffect(document, document.name);
  effect.changes.push(
    {
      key: "system.attributes.ac.bonus",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: `+ ${ddbMonster.npc.system.abilities.cha.mod}`,
      priority: "20",
    },
  );

  document.effects.push(effect);
  return document;
}
