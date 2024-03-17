import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function hailOfThornsEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  await DDBMacros.setItemMacroFlag(document, "spell", "hailOfThorns.js");
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "spell", macroName: "hailOfThorns.js", document }),
  );
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = null;
  document.system.save.ability = "";
  document.system.target.type = "self";

  return document;
}
