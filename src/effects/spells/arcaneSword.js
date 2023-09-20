import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function arcaneSwordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "arcaneSword.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "arcaneSword.js" }));

  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";

  document.effects.push(effect);
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "arcaneSword.js", ["preTargeting"]);

  return document;
}
