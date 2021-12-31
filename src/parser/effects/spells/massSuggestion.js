import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function massSuggestionEffect(document) {
  let effectMassSuggestionMassSuggestion = baseSpellEffect(document, document.name);
  effectMassSuggestionMassSuggestion.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectMassSuggestionMassSuggestion);

  return document;
}
