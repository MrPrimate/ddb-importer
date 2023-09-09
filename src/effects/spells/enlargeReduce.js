import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";
import { effectModules } from "../effects.js";

export async function enlargeReduceEffect(document) {
  if (!effectModules().atlInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "enlargeReduce.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));
  document.effects.push(effect);

  return document;
}
