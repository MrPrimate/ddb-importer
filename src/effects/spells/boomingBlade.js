import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function boomingBladeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "boomingBlade.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  document.data.damage = { parts: [], versatile: "", value: "" };
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  return document;
}
