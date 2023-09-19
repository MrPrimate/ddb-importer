import DDBMacros from "../macros.js";

export async function sleepEffect(document) {

  const itemMacroText = await DDBMacros.loadMacroFile("spell", "sleep.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "sleep.js", ["postActiveEffects"]);
  document.system.damage = { parts: [["5d8", "midi-none"]], versatile: "", value: "" };

  return document;
}
