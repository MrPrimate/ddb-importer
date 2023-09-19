import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function chromaticOrbEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "chromaticOrb.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setMidiOnUseMacroFlag(document, "spell", "chromaticOrb.js", ["postDamageRoll"]);

  return document;
}
