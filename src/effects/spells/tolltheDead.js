import { DDBMacros } from "../../lib/_module.mjs";

export async function tolltheDeadEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "spell", "tolltheDead.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "tolltheDead.js", ["postActiveEffects"]);

  document.system.damage = { parts: [], versatile: "", value: "" };
  return document;
}
