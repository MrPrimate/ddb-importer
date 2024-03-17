import DDBMacros from "../DDBMacros.js";
import { baseFeatEffect } from "../specialFeats.js";

export async function arcaneRecoveryEffect(document) {
  let effect = baseFeatEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "feat", "arcaneRecovery.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "feat", macroName: "arcaneRecovery.js" }));
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.effects.push(effect);
  document.system.actionType = "";

  return document;
}
