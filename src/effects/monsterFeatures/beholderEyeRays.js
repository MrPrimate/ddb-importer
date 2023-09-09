import { baseFeatEffect } from "../specialFeats.js";
import { loadMacroFile, generateItemMacroFlag } from "../macros.js";
// import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function beholderEyeRaysEffect(document) {
  setProperty(document, "system.target", { value: 3, width: null, units: "", type: "creature" });
  setProperty(document, "system.range", { value: 120, long: null, units: "ft" });
  setProperty(document, "system.damage", { parts: [], versatile: "", value: "" });
  setProperty(document, "system.activation.type", "action");

  let effect = baseFeatEffect(document, document.name);
  const itemMacroText = await loadMacroFile("monsterFeature", "beholderEyeRay.js");
  document = generateItemMacroFlag(document, itemMacroText);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[postActiveEffects]ItemMacro");
  // effect.changes.push(generateMacroChange(""));
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}
