import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function animalFriendshipEffect(document) {
  let effectAnimalFriendshipCharmed = baseSpellEffect(document, document.name);
  effectAnimalFriendshipCharmed.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectAnimalFriendshipCharmed);

  return document;
}
