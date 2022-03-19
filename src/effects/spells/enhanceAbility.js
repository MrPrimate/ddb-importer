import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function enhanceAbilityEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "enhanceAbility.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 20, true));
  document.effects.push(effect);

  return document;
}
