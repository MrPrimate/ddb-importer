import { baseSpellEffect } from "../specialSpells.js";
import DDBMacros from "../DDBMacros.mjs";
import { effectModules } from "../effects.js";

export async function ensnaringStrikeEffect(document) {
  if (effectModules().midiQolInstalled) {
    document.effects = [];
    let effect = baseSpellEffect(document, document.name);
    await DDBMacros.setItemMacroFlag(document, "spell", "ensnaringStrike.js");
    effect.changes.push(
      DDBMacros.generateOnUseMacroChange({ macroPass: "postActiveEffects", macroType: "spell", macroName: "ensnaringStrike.js", document }),
    );
    foundry.utils.setProperty(effect, "flags.dae.selfTarget", true);
    foundry.utils.setProperty(effect, "flags.dae.selfTargetAlways", true);

    document.effects.push(effect);
    document.system.damage = { parts: [], versatile: "", value: "" };
    document.system.actionType = null;
    document.system.save.ability = "";
    document.system.target.type = "self";
    // DDBMacros.setMidiOnUseMacroFlag(document, "spell", "ensnaringStrike.js", ["preTargeting"]);
  }

  return document;
}
