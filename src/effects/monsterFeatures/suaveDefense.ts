
import { baseItemEffect } from "../effects";

export function generateSuaveDefenseEffect(ddbMonster, document) {
  const effect = baseItemEffect(document, document.name);
  effect.system.changes.push(
    {
      key: "system.attributes.ac.bonus",
      type: "add",
      value: `+ ${ddbMonster.npc.system.abilities.cha.mod}`,
      priority: "20",
    },
  );

  document.effects.push(effect);
  return document;
}
