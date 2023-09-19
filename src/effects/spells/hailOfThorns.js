import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag, generateOnUseMacroChange } from "../macros.js";

export async function hailOfThornsEffect(document) {
  let effect = baseSpellEffect(document, document.name);

  const itemMacroText = await loadMacroFile("spell", "hailOfThorns.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(
    generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "spell", macroName: "hailOfThorns.js", document }),
  );
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = null;
  document.system.save.ability = "";
  document.system.target.type = "self";

  return document;
}
