import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function geasEffect(document) {
  let effectGeasGeas = baseSpellEffect(document, document.name);
  effectGeasGeas.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectGeasGeas);

  return document;
}
