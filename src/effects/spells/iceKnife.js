import DDBMacros from "../macros.js";

export async function iceKnifeEffect(document) {
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "iceKnife.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "iceKnife.js", ["postActiveEffects"]);
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
