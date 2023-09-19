import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function sleepEffect(document) {

  const itemMacroText = await loadMacroFile("spell", "sleep.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setMidiOnUseMacroFlag(document, "spell", "sleep.js", ["postActiveEffects"]);
  document.system.damage = { parts: [["5d8", "midi-none"]], versatile: "", value: "" };

  return document;
}
