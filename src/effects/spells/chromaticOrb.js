import DDBMacros from "../macros.js";

export async function chromaticOrbEffect(document) {
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "chromaticOrb.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "chromaticOrb.js", ["postDamageRoll"]);

  return document;
}
