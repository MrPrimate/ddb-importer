import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "../macros.js";

export async function fireShieldEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "fireShield.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange("", 0));

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.target.type = "self";
  setProperty(document, "system.actionType", "util");

  setProperty(effect, "flags.dae.selfTargetAlways", true);
  return document;
}
