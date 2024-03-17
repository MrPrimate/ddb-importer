import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function planarWarriorEffect(document) {
  await DDBMacros.setItemMacroFlag(document, "feat", "planarWarrior.js");

  let effect = baseFeatEffect(document, "Marked by Planar Warrior");

  foundry.utils.setProperty(effect, "duration.turns", 1);
  DDBMacros.setMidiOnUseMacroFlag(document, "feat", "planarWarrior.js", ["preItemRoll", "preActiveEffects"]);

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
