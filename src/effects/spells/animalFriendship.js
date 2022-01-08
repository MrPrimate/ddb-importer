import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function animalFriendshipEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effect);

  return document;
}
