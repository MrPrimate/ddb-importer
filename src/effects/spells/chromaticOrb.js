import { loadMacroFile, generateMacroFlags } from "../macros.js";

export async function chromaticOrbEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "chromaticOrb.js");
  setProperty(document, "flags.itemacro", generateMacroFlags(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");

  return document;
}
