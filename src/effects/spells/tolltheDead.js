import { loadMacroFile, generateMacroFlags } from "../macros.js";

export async function tolltheDeadEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "tolltheDead.js");
  setProperty(document, "flags.itemacro", generateMacroFlags(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");

  document.data.damage = { parts: [], versatile: "", value: "" };
  return document;
}
