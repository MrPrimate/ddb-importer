import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function cloakOfDisplacementEffect(document) {
  let effect = baseItemEffect(document, `${document.name} - Check`);
  setProperty(effect, "flags.dae.macroRepeat", "startEveryTurn");
  const itemMacroText = await loadMacroFile("item", "cloakOfDisplacement.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  document.effects[0] = effect;

  // setProperty(document.effects[0], "flags.dae.specialDuration", ["isDamaged"]);

  return document;
}
