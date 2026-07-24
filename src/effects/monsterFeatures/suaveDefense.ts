
import type DDBMonster from "../../parser/DDBMonster";
import { baseItemEffect } from "../effects";

export function generateSuaveDefenseEffect(_ddbMonster: DDBMonster, document: I5eMonsterItem) {
  const effect = baseItemEffect(document, document.name);
  effect.system.changes.push(
    {
      key: "system.attributes.ac.bonus",
      type: "add",
      value: `+ @abilities.cha.mod`,
      priority: 20,
    },
  );

  document.effects ??= [];
  document.effects.push(effect);
  return document;
}
