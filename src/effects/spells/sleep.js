import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function sleepEffect(document) {

  const itemMacroText = await loadMacroFile("spell", "sleep.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  document.system.damage = { parts: [["5d8", "midi-none"]], versatile: "", value: "" };

  return document;
}
