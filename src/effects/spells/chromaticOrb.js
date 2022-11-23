import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function chromaticOrbEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "chromaticOrb.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postDamageRoll]ItemMacro");

  return document;
}
