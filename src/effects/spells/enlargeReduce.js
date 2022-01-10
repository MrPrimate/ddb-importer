import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";

export async function enlargeReduceEffect(document) {
  if (!spellEffectModules().atlInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "enlargeReduce.js");
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));
  document.effects.push(effect);

  return document;
}
