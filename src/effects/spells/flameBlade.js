import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function flameBladeEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "flameBlade.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("@spellLevel"));
  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.actionType = "other";
  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preTargeting]ItemMacro");

  return document;
}
