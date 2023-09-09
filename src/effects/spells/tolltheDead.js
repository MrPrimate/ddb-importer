import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function tolltheDeadEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "tolltheDead.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");

  document.system.damage = { parts: [], versatile: "", value: "" };
  return document;
}
