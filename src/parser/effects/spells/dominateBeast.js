import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function dominateBeastEffect(document) {
  let effectDominateBeastDominateBeast = baseSpellEffect(document, document.name);
  effectDominateBeastDominateBeast.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectDominateBeastDominateBeast);

  return document;
}
