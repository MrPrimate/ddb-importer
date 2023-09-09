import { loadMacroFile, generateItemMacroFlag, generateMacroChange } from "../macros.js";
import { baseFeatEffect } from "../specialFeats.js";

export async function arcaneRecoveryEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  const itemMacroText = await loadMacroFile("feat", "arcaneRecovery.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);
  document.system.actionType = "";

  return document;
}
