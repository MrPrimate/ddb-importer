import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function sleepEffect(document) {

  const itemMacroText = await loadMacroFile("spell", "sleep.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  document.data.damage.parts[0][1] = "midi-none";

  return document;
}
