import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function holdMonsterEffect(document) {
  let effectHoldMonsterParalyzed = baseSpellEffect(document, document.name);
  effectHoldMonsterParalyzed.changes.push(generateStatusEffectChange("Paralyzed"));
  document.effects.push(effectHoldMonsterParalyzed);

  return document;
}
