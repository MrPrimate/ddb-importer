import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function colorSprayEffect(document) {

  const itemMacroText = await loadMacroFile("spell", "colorSpray.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setMidiOnUseMacroFlag(document, "spell", "colorSpray.js", ["postActiveEffects"]);
  document.system.damage = { parts: [["6d10", "midi-none"]], versatile: "", value: "" };

  return document;
}
