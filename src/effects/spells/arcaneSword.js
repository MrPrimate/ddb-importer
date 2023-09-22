import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function arcaneSwordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";

  await DDBMacros.setItemMacroFlag(document, "spell", "arcaneSword.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "arcaneSword.js" }));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);

  document.effects.push(effect);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "arcaneSword.js", ["preTargeting"]);

  return document;
}
