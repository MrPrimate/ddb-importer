import { baseFeatEffect } from "../specialFeats.js";
import DDBMacros from "../DDBMacros.js";

export async function beholderEyeRaysEffect(document) {
  setProperty(document, "system.target", { value: 3, width: null, units: "", type: "creature" });
  setProperty(document, "system.range", { value: 120, long: null, units: "ft" });
  setProperty(document, "system.damage", { parts: [], versatile: "", value: "" });
  setProperty(document, "system.activation.type", "action");

  let effect = baseFeatEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "monsterFeature", "beholderEyeRay.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "monsterFeature", "beholderEyeRay.js", ["postActiveEffects"]);
  // effect.changes.push(DDBMacros.generateMacroChange({ macroValues: `"${document.name}"`, macroType: "monsterFeature", macroName: "beholderEyeRay.js" }));
  effect.transfer = false;

  document.effects.push(effect);
  return document;
}
