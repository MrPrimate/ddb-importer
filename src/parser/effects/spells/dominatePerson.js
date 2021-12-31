import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function dominatePersonEffect(document) {
  let effectDominatePersonDominatePerson = baseSpellEffect(document, document.name);
  effectDominatePersonDominatePerson.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectDominatePersonDominatePerson);

  return document;
}
