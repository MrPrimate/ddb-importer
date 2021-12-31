import { baseSpellEffect, generateStatusEffectChange } from "../specialSpells.js";

export function charmPersonEffect(document) {
  let effectCharmPersonCharmPerson = baseSpellEffect(document, document.name);
  effectCharmPersonCharmPerson.changes.push(generateStatusEffectChange("Charmed"));
  document.effects.push(effectCharmPersonCharmPerson);

  return document;
}
