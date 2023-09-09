import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function boomingBladeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "boomingBlade.js");
  document = generateItemMacroFlag(document, itemMacroText);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  return document;
}
