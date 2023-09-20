import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function shillelaghEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "shillelagh.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "spell", macroName: "shillelagh.js", priority: 0 }));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.actionType = "other";
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "shillelagh.js", ["preTargeting"]);

  return document;
}
