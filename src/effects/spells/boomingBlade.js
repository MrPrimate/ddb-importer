import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function boomingBladeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "boomingBlade.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data['target']['type'] = "self";
  document.data.range = { value: null, units: "self", long: null };
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  return document;
}
