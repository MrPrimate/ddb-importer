import DDBMacros from "../DDBMacros.js";

export async function chromaticOrbEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "spell", "chromaticOrb.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "chromaticOrb.js", ["postDamageRoll"]);

  return document;
}
