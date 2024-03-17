import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function arcaneSwordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";

  await DDBMacros.setItemMacroFlag(document, "spell", "arcaneSword.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "arcaneSword.js" }));
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "arcaneSword.js", ["preTargeting"]);

  return document;
}
