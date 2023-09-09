import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function greenFlameBladeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "greenFlameBlade.js");
  document = generateItemMacroFlag(document, itemMacroText);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.system.save.ability = "";
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  return document;
}
