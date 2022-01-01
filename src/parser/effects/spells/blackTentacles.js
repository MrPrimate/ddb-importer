import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function blackTentaclesEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Restrained"));
  document.effects.push(effect);

  return document;
}
