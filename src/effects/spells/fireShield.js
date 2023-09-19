import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function fireShieldEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  const itemMacroText = await DDBMacros.loadMacroFile("spell", "fireShield.js");
  document = DDBMacros.generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(
    DDBMacros.generateOnUseMacroChange({ macroPass: "isDamaged", macroType: "spell", macroName: "fireShield.js" }),
  );
  DDBMacros.setMidiOnUseMacroFlag(document, "spell", "fireShield.js", ["postActiveEffects"]);

  effect.duration.seconds = 600;
  effect.duration.rounds = 60;

  document.effects.push(effect);
  document.system.damage = { parts: [], versatile: "", value: "" };
  document.system.target.type = "self";
  setProperty(document, "system.actionType", "util");

  setProperty(effect, "flags.dae.selfTargetAlways", true);
  return document;
}
