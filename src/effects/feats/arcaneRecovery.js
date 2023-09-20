import DDBMacros from "../macros.js";
import { baseFeatEffect } from "../specialFeats.js";

export async function arcaneRecoveryEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("feat", "arcaneRecovery.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "feat", macroName: "arcaneRecovery.js" }));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);
  document.system.actionType = "";

  return document;
}
