import DDBMacros from "../DDBMacros.js";

export async function colorSprayEffect(document) {
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "colorSpray.js", ["postActiveEffects"]);
  document.system.damage = { parts: [["6d10", "midi-none"]], versatile: "", value: "" };
  await DDBMacros.setItemMacroFlag(document, "spell", "colorSpray.js");

  return document;
}
