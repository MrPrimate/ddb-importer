import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function chromaticOrbEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "chromaticOrb.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postDamageRoll]ItemMacro");

  return document;
}
