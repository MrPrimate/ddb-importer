import DDBMacros from "../macros.js";

export async function tolltheDeadEffect(document) {
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "tolltheDead.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "tolltheDead.js", ["postActiveEffects"]);

  document.system.damage = { parts: [], versatile: "", value: "" };
  return document;
}
