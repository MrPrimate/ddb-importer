import DDBMacros from "../macros.js";

export async function boomingBladeEffect(document) {
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "boomingBlade.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "boomingBlade.js", ["postActiveEffects"]);
  return document;
}
