import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function flameBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "flameBlade.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(DDBMacros.generateMacroChange("@spellLevel"));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.actionType = "other";
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "flameBlade.js", ["preTargeting"]);

  return document;
}
