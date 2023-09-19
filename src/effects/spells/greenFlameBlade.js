import DDBMacros from "../macros.js";

export async function greenFlameBladeEffect(document) {
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "greenFlameBlade.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.system.save.ability = "";
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "greenFlameBlade.js", ["postActiveEffects"]);
  return document;
}
