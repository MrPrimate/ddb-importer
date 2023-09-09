import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";

export async function fontOfMagicEffect(document) {
  let effect = baseItemEffect(document, document.name);
  const itemMacroText = await loadMacroFile("feat", "fontOfMagic.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preItemRoll]ItemMacro");

  document.effects.push(effect);
  document.system.activation.type = "bonus";
  document.system["target"]["type"] = "self";
  document.system.range = { value: null, units: "self", long: null };

  return document;
}
