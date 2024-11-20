import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";

export async function fireShieldEffect(document) {
  if (effectModules().midiQolInstalled) {
    document.effects = [];
    let effect = baseSpellEffect(document, document.name);
    await DDBMacros.setItemMacroFlag(document, "spell", "fireShield.js");
    effect.changes.push(
      DDBMacros.generateOnUseMacroChange({ macroPass: "isDamaged", macroType: "spell", macroName: "fireShield.js" }),
    );
    DDBMacros.setMidiOnUseMacroFlag(document, "spell", "fireShield.js", ["postActiveEffects"]);

    effect.duration.seconds = 600;
    effect.duration.rounds = 60;

    document.effects.push(effect);
    document.system.target.type = "self";
    foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);
  }
  return document;
}
