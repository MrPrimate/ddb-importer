import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function arcaneSwordEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "arcaneSword.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange(""));

  setProperty(effect, "flags.dae.selfTarget", true);
  setProperty(effect, "flags.dae.selfTargetAlways", true);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.actionType = "other";

  document.effects.push(effect);
  setProperty(document, "flags.midi-qol.onUseMacroName", "[preTargeting]ItemMacro");

  return document;
}
