import { baseItemEffect } from "../effects.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function pearlOfPowerEffect(document) {
  let effect = baseItemEffect(document, document.name);
  const itemMacroText = await loadMacroFile("item", "pearlOfPower.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(`"${document.name}"`));
  effect.transfer = false;
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  return document;
}
