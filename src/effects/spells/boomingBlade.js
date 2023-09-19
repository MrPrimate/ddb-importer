import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function boomingBladeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "boomingBlade.js");
  document = generateItemMacroFlag(document, itemMacroText);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  setMidiOnUseMacroFlag(document, "spell", "boomingBlade.js", ["postActiveEffects"]);
  return document;
}
