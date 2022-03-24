import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function shillelaghEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "shillelagh.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));

  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system['target']['type'] = "self";
  document.system.range = { value: null, units: "self", long: null };
  document.system.actionType = "other";
  document.effects.push(effect);

  return document;
}
