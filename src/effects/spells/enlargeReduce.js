import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function enlargeReduceEffect(document) {
  if (!spellEffectModules().atlInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "enlargeReduce.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));
  document.effects.push(effect);

  return document;
}
