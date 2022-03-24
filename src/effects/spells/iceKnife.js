import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function iceKnifeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "iceKnife.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  document.system.damage = { parts: [["1d10", "piercing"]], versatile: "", value: "" };
  document.system.scaling = { mode: "none", formula: "" };
  document.system.target = {
    value: 1,
    width: null,
    units: "",
    type: "creature",
  };
  document.system.save.ability = "";
  return document;
}
