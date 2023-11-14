import DDBMacros from "../DDBMacros.js";

export async function iceKnifeEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "spell", "iceKnife.js");
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
