import { baseItemEffect } from "../effects.js";
import DDBMacros from "../macros.js";

export async function pearlOfPowerEffect(document) {
  let effect = baseItemEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "item", "pearlOfPower.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: `"${document.name}"`, macroType: "item", macroName: "pearlOfPower.js" }));
  effect.transfer = false;
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);

  return document;
}
