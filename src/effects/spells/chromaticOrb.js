import { DDBMacros } from "../../lib/_module.mjs";

export async function chromaticOrbEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "spell", "chromaticOrb.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "chromaticOrb.js", ["postDamageRoll"]);

  return document;
}
