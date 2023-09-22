import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function flameBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(DDBMacros.generateMacroChange({ macroValues: "@spellLevel", macroType: "spell", macroName: "flameBlade.js" }));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.actionType = "other";
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "flameBlade.js", ["preTargeting"]);
  await DDBMacros.setItemMacroFlag(document, "spell", "flameBlade.js");
  return document;
}
