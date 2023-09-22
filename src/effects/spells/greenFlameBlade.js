import DDBMacros from "../macros.js";

export async function greenFlameBladeEffect(document) {
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.system.save.ability = "";
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "greenFlameBlade.js", ["postActiveEffects"]);
  await DDBMacros.setItemMacroFlag(document, "spell", "greenFlameBlade.js");
  return document;
}
