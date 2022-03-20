import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function iceKnifeEffect(document) {
  const itemMacroText = await loadMacroFile("spell", "iceKnife.js");
  setProperty(document, "flags.itemacro", generateItemMacroFlag(document, itemMacroText));
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  document.data.damage = { parts: [["1d10", "piercing"]], versatile: "", value: "" };
  document.data.scaling = { mode: "none", formula: "" };
  document.data.target = {
    value: 1,
    width: null,
    units: "",
    type: "creature",
  };
  document.data.save.ability = "";
  return document;
}
