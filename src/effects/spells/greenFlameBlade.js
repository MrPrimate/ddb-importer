import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function greenFlameBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "greenFlameBlade.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@target"));
  document.effects.push(effect);

  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data['target']['type'] = "creature";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = "other";
  document.data.save.ability = "";

  return document;
}
