import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function colorSprayEffect(document) {

  const itemMacroText = await loadMacroFile("spell", "colorSpray.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  document.system.damage = { parts: [["6d10", "midi-none"]], versatile: "", value: "" };

  return document;
}
