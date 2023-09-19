import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function tolltheDeadEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "tolltheDead.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setMidiOnUseMacroFlag(document, "spell", "tolltheDead.js", ["postActiveEffects"]);

  document.system.damage = { parts: [], versatile: "", value: "" };
  return document;
}
