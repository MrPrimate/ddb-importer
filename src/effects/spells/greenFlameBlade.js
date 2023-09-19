import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function greenFlameBladeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "greenFlameBlade.js");
  document = generateItemMacroFlag(document, itemMacroText);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.system.save.ability = "";
  setMidiOnUseMacroFlag(document, "spell", "greenFlameBlade.js", ["postActiveEffects"]);
  return document;
}
