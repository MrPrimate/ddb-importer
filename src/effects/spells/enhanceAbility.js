import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function enhanceAbilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "enhanceAbility.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange(""));
  document.effects.push(effect);

  return document;
}
