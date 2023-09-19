import DDBMacros from "../macros.js";

export async function colorSprayEffect(document) {

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "colorSpray.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "colorSpray.js", ["postActiveEffects"]);
  document.system.damage = { parts: [["6d10", "midi-none"]], versatile: "", value: "" };

  return document;
}
