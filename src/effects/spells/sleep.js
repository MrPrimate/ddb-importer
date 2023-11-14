import DDBMacros from "../DDBMacros.js";

export async function sleepEffect(document) {

  await DDBMacros.setItemMacroFlag(document, "spell", "sleep.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "sleep.js", ["postActiveEffects"]);
  document.system.damage = { parts: [["5d8", "midi-none"]], versatile: "", value: "" };

  return document;
}
