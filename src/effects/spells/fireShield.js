import { baseSpellEffect } from "../specialSpells.js";
import { loadMacroFile, generateItemMacroFlag, generateOnUseMacroChange, setMidiOnUseMacroFlag } from "../macros.js";

export async function fireShieldEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await loadMacroFile("spell", "fireShield.js");
  document = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(
    generateOnUseMacroChange("ItemMacro", "isDamaged")
  );
  setMidiOnUseMacroFlag(document, "spell", "fireShield.js", ["postActiveEffects"]);

  effect.duration.seconds = 600;
  effect.duration.rounds = 60;

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.target.type = "self";
  setProperty(document, "system.actionType", "util");

  setProperty(effect, "flags.dae.selfTargetAlways", true);
  return document;
}
