import { baseItemEffect } from "../effects.js";
import DDBMacros from "../macros.js";

export async function pearlOfPowerEffect(document) {
  let effect = baseItemEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("item", "pearlOfPower.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange(`"${document.name}"`));
  effect.transfer = false;
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  return document;
}
