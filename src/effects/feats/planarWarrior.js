import { baseFeatEffect } from "../specialFeats.js";
import { generateStatusEffectChange } from "../effects.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function planarWarriorEffect(document) {
  const itemMacroText = await loadMacroFile("feat", "planarWarrior.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);

  let effect = baseFeatEffect(document, "Marked by Planar Warrior");

  setProperty(effect, "duration.turns", 1);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preItemRoll]ItemMacro,[preActiveEffects]ItemMacro");

  document.effects.push(effect);

  document.data.target = {
    value: 1,
    width: null,
    units: "",
    type: "creature",
  };
  document.data.range = {
    value: 30,
    long: null,
    units: "ft",
  };
  document.data.damage = {
    parts: [],
    versatile: "",
    value: "",
  };

  return document;
}
