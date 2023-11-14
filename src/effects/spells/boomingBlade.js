import DDBMacros from "../DDBMacros.js";

export async function boomingBladeEffect(document) {
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  await DDBMacros.setItemMacroFlag(document, "spell", "boomingBlade.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "boomingBlade.js", ["postActiveEffects"]);
  return document;
}
