import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function dominateMonsterEffect(document) {
  let effectDominateMonsterDominateMonster = baseSpellEffect(document, document.name);
  effectDominateMonsterDominateMonster.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectDominateMonsterDominateMonster);

  return document;
}
