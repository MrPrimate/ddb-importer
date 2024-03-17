import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.js";

export async function shillelaghEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "shillelagh.js", priority: 0 }));
  foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
  foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.actionType = "other";
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "shillelagh.js", ["preTargeting"]);
  await DDBMacros.setItemMacroFlag(document, "spell", "shillelagh.js");
  return document;
}
