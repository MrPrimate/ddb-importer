import { baseFeatEffect } from "../specialFeats.js";
import { loadMacroFile, generateItemMacroFlag, setMidiOnUseMacroFlag } from "../macros.js";

export async function planarWarriorEffect(document) {
  const itemMacroText = await loadMacroFile("feat", "planarWarrior.js");
  document = generateItemMacroFlag(document, itemMacroText);

  let effect = baseFeatEffect(document, "Marked by Planar Warrior");

  setProperty(effect, "duration.turns", 1);
  setMidiOnUseMacroFlag(document, "feat", "planarWarrior.js", ["preItemRoll", "preActiveEffects"]);

  document.effects.push(effect);

  document.system.target = {
    value: 1,
    width: null,
    units: "",
    type: "creature",
  };
  document.system.range = {
    value: 30,
    long: null,
    units: "ft",
  };
  document.system.damage = {
    parts: [],
    versatile: "",
    value: "",
  };

  return document;
}
