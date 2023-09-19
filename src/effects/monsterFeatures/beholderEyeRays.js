import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../macros.js";

export async function beholderEyeRaysEffect(document) {
  setProperty(document, "system.target", { value: 3, width: null, units: "", type: "creature" });
  setProperty(document, "system.range", { value: 120, long: null, units: "ft" });
  setProperty(document, "system.damage", { parts: [], versatile: "", value: "" });
  setProperty(document, "system.activation.type", "action");

  let effect = baseFeatEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("monsterFeature", "beholderEyeRay.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "beholderEyeRay.js", ["postActiveEffects"]);
  // effect.changes.push(DDBMacros.generateMacroChange(""));
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}
