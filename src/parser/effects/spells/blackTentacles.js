import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function blackTentaclesEffect(document) {
  let effectBlackTentaclesBlackTentacles = baseSpellEffect(document, document.name);
  effectBlackTentaclesBlackTentacles.changes.push(generateStatusEffectChange("Restrained"));
  document.effects.push(effectBlackTentaclesBlackTentacles);

  return document;
}
