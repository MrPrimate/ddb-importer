import DDBMacros from "../DDBMacros.mjs";

export async function stormAuraTundraEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "feat", "stormAuraTundra.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "stormAuraTundra.js", ["postActiveEffects"]);
  return document;
}
