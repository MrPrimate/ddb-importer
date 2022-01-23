import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function arcaneSwordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "arcaneSword.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));

  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data['target']['type'] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = "other";

  document.effects.push(effect);

  return document;
}
