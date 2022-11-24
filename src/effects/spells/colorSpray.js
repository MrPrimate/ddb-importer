import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function colorSprayEffect(document) {

  const itemMacroText = await loadMacroFile("spell", "colorSpray.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  document.system.damage.parts[0][1] = "midi-none";

  return document;
}
