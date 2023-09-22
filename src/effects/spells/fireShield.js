import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../macros.js";

export async function fireShieldEffect(document) {
  let effect = baseSpellEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "spell", "fireShield.js");
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
